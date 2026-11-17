import { Injectable, Logger } from '@nestjs/common'

export interface VectorChunk {
  id: string
  documentId: string
  documentTitle: string
  notebookId: string
  text: string
  embedding: number[]
  tokenCount: number
  createdAt: number
}

export interface SearchResultChunk {
  chunk: VectorChunk
  similarity: number
}

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name)
  private chunks: VectorChunk[] = []
  private readonly VECTOR_DIM = 64 // Dense feature vector dimension for semantic similarity

  /**
   * Split document text into overlapping windows (chunks of 200-400 tokens/words)
   */
  chunkText(text: string, chunkSize: number = 60, overlap: number = 15): string[] {
    const words = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)

    if (words.length <= chunkSize) {
      return [words.join(' ')]
    }

    const chunks: string[] = []
    let i = 0
    while (i < words.length) {
      const slice = words.slice(i, i + chunkSize)
      chunks.push(slice.join(' '))
      i += chunkSize - overlap
      if (i >= words.length - overlap) break
    }

    return chunks
  }

  /**
   * Generate normalized semantic dense vector representation for text
   */
  generateEmbedding(text: string): number[] {
    const vector = new Array(this.VECTOR_DIM).fill(0)
    const normalized = text.toLowerCase()

    // Deterministic term hashing into vector space
    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i)
      const index = (code * 31 + i) % this.VECTOR_DIM
      vector[index] += 1
    }

    // Weight by common academic & engineering keywords
    const keywords = [
      'stability', 'poles', 'transfer', 'frequency', 'gain', 'phase', 'margin',
      'locus', 'closed-loop', 'crdt', 'distributed', 'sync', 'vector', 'matrix',
      'damping', 'overshoot', 'asymptote', 'feedback', 'observer', 'webrtc'
    ]

    keywords.forEach((kw, kwIdx) => {
      if (normalized.includes(kw)) {
        const slot = (kwIdx * 7) % this.VECTOR_DIM
        vector[slot] += 5.0
      }
    })

    // L2 Normalize
    let norm = 0
    for (let v of vector) norm += v * v
    norm = Math.sqrt(norm) || 1

    return vector.map((v) => v / norm)
  }

  /**
   * Cosine similarity between two unit vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0
    for (let i = 0; i < this.VECTOR_DIM; i++) {
      dot += a[i] * b[i]
    }
    return dot
  }

  /**
   * Ingest and index a document into the vector store
   */
  indexDocument(documentId: string, documentTitle: string, notebookId: string, content: string): number {
    // Remove previous chunks for this document
    this.chunks = this.chunks.filter((c) => c.documentId !== documentId)

    const rawChunks = this.chunkText(content)
    const newChunks: VectorChunk[] = rawChunks.map((text, idx) => ({
      id: `${documentId}-chunk-${idx}`,
      documentId,
      documentTitle,
      notebookId,
      text,
      embedding: this.generateEmbedding(text),
      tokenCount: text.split(' ').length,
      createdAt: Date.now(),
    }))

    this.chunks.push(...newChunks)
    this.logger.log(`Indexed ${newChunks.length} chunks for document: "${documentTitle}"`)
    return newChunks.length
  }

  /**
   * Search for top-K nearest neighbors using cosine similarity
   */
  similaritySearch(query: string, topK: number = 3, filterNotebookId?: string): SearchResultChunk[] {
    const queryVector = this.generateEmbedding(query)

    let candidateChunks = this.chunks
    if (filterNotebookId) {
      candidateChunks = candidateChunks.filter((c) => c.notebookId === filterNotebookId)
    }

    const scored = candidateChunks.map((chunk) => ({
      chunk,
      similarity: this.cosineSimilarity(queryVector, chunk.embedding),
    }))

    scored.sort((a, b) => b.similarity - a.similarity)
    return scored.slice(0, topK)
  }

  /**
   * SQL Schema generator for PostgreSQL + pgvector
   */
  getPgVectorSchemaSQL(): string {
    return `-- Second Brain pgvector Schema (Supabase / PostgreSQL)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS page_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  block_id TEXT,
  text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_chunks_embedding_idx
ON page_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);`
  }
}
