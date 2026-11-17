import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

export interface ServerDocument {
  id: string
  notebookId: string
  workspaceId: string
  title: string
  icon: string
  content: string
  ydocState?: string // Base64 encoded Yjs snapshot
  canvasStrokes?: any[]
  updatedAt: string
  createdAt: string
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name)
  private documents = new Map<string, ServerDocument>()
  private dataDir = path.resolve(process.cwd(), '.data')
  private dataFile = path.join(this.dataDir, 'documents.json')

  constructor() {
    this.initStorage()
  }

  private initStorage() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true })
      }

      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf-8')
        const parsed: ServerDocument[] = JSON.parse(raw)
        parsed.forEach((doc) => this.documents.set(doc.id, doc))
        this.logger.log(`Loaded ${parsed.length} documents from persistent store (${this.dataFile})`)
        return
      }
    } catch (err) {
      this.logger.warn(`Failed to read from persistent store: ${err.message}`)
    }

    this.seedDemoDocuments()
    this.saveToDisk()
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true })
      }
      const data = Array.from(this.documents.values())
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf-8')
    } catch (err) {
      this.logger.error(`Failed to write to persistent store: ${err.message}`)
    }
  }

  private seedDemoDocuments() {
    const demoDocs: ServerDocument[] = [
      {
        id: 'pg-1',
        notebookId: 'nb-1',
        workspaceId: 'ws-1',
        title: 'Feedback Stability',
        icon: '📊',
        content: `<h2>Closed-loop stability</h2><p>For a continuous-time LTI system, all closed-loop poles must lie in the left half-plane. A positive real part means the response grows with time.</p><p>Characteristic equation: <code>1 + G(s)H(s) = 0</code></p>`,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pg-2',
        notebookId: 'nb-1',
        workspaceId: 'ws-1',
        title: 'Bode Plots',
        icon: '📈',
        content: `<h2>Bode Plot Analysis & Stability Margins</h2><p>Gain Margin (GM) and Phase Margin (PM) quantify system stability robustness in the frequency domain.</p>`,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pg-3',
        notebookId: 'nb-1',
        workspaceId: 'ws-1',
        title: 'Root Locus',
        icon: '✏️',
        content: `<h2>Root Locus Construction Rules</h2><p>The root locus is the trajectory of closed-loop poles in the complex s-plane as loop gain K varies from 0 to infinity.</p>`,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pg-4',
        notebookId: 'nb-2',
        workspaceId: 'ws-1',
        title: 'Design Patterns',
        icon: '🏗️',
        content: `<h2>Architectural & Behavioral Design Patterns</h2><p>Observer, Strategy, Factory Method, and Event Sourcing patterns applied to real-time collaboration engines.</p>`,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pg-5',
        notebookId: 'nb-2',
        workspaceId: 'ws-1',
        title: 'CRDT & Sync',
        icon: '🔄',
        content: `<h2>CRDT & Conflict-Free Distributed Synchronization</h2><p>Conflict-free Replicated Data Types (CRDTs) allow concurrent updates on distributed peers without a central lock coordinator.</p>`,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]

    for (const doc of demoDocs) {
      this.documents.set(doc.id, doc)
    }
  }

  findAll(): ServerDocument[] {
    return Array.from(this.documents.values())
  }

  findById(id: string): ServerDocument {
    const doc = this.documents.get(id)
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`)
    }
    return doc
  }

  create(doc: Partial<ServerDocument>): ServerDocument {
    const id = doc.id || `doc-${Date.now()}`
    const newDoc: ServerDocument = {
      id,
      notebookId: doc.notebookId || 'nb-1',
      workspaceId: doc.workspaceId || 'ws-1',
      title: doc.title || 'Untitled Document',
      icon: doc.icon || '📄',
      content: doc.content || '',
      ydocState: doc.ydocState,
      canvasStrokes: doc.canvasStrokes || [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    this.documents.set(id, newDoc)
    this.saveToDisk()
    return newDoc
  }

  update(id: string, updates: Partial<ServerDocument>): ServerDocument {
    const doc = this.findById(id)
    const updated: ServerDocument = {
      ...doc,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.documents.set(id, updated)
    this.saveToDisk()
    return updated
  }

  delete(id: string): { success: boolean } {
    if (!this.documents.has(id)) {
      throw new NotFoundException(`Document with ID ${id} not found`)
    }
    this.documents.delete(id)
    this.saveToDisk()
    return { success: true }
  }
}
