-- =============================================================================
-- Second Brain: Relational & Vector Database Schema (Supabase / PostgreSQL)
-- Bachelor's Thesis: AI-Augmented Collaborative Workspace (ACS, UNSTPB)
-- =============================================================================

-- Enable pgvector extension for semantic chunk embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('personal', 'university', 'project')),
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Notebooks
CREATE TABLE IF NOT EXISTS notebooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📁',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Pages / Documents
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  parent_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  icon TEXT DEFAULT '📄',
  cover TEXT,
  content_json JSONB, -- Clean structured backup
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Page Snapshots (CRDT Yjs Binary State)
-- Stores the authoritative Y.Doc binary snapshot bytea
CREATE TABLE IF NOT EXISTS page_snapshots (
  page_id UUID PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,
  ydoc_state BYTEA NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Page Chunks (Vector RAG)
CREATE TABLE IF NOT EXISTS page_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  block_id TEXT,
  text TEXT NOT NULL,
  embedding vector(1536), -- Compatible with text-embedding-3-small
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast approximate nearest neighbor index for Cosine Distance
CREATE INDEX IF NOT EXISTS page_chunks_embedding_cosine_idx
ON page_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 6. Page Links (Knowledge Graph semantic and manual edges)
CREATE TABLE IF NOT EXISTS page_links (
  source_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  target_page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('manual', 'ai')),
  score REAL DEFAULT 1.0,
  PRIMARY KEY (source_page_id, target_page_id)
);

-- 7. Action Items / Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  due_at TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  source_block_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
