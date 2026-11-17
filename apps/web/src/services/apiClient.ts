/**
 * Second Brain Backend API Client
 */

const API_BASE = 'http://localhost:3001/api'

export interface AskAiResponse {
  answer: string
  citations: { index: number; documentId: string; title: string; quote: string }[]
  retrievedCount: number
  similarityScores?: number[]
}

export interface BackendDocument {
  id: string
  notebookId: string
  workspaceId: string
  title: string
  icon: string
  content: string
  ydocState?: string
  updatedAt: string
}

export interface BackendTask {
  id: string
  text: string
  pageId: string
  noteTitle: string
  notebook: string
  done: boolean
  dueDate?: string
  priority: 'high' | 'medium' | 'low'
}

export const apiClient = {
  /**
   * Check backend server status
   */
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2500) })
      return await res.json()
    } catch {
      return null
    }
  },

  /**
   * Ask AI Copilot grounded in notes
   */
  async askCopilot(query: string, notebookId?: string): Promise<AskAiResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, notebookId }),
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) throw new Error('API failed')
      return await res.json()
    } catch {
      return null
    }
  },

  /**
   * Extract action items from note text
   */
  async extractTasks(content: string) {
    try {
      const res = await fetch(`${API_BASE}/ai/extract-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
        signal: AbortSignal.timeout(4000),
      })
      if (!res.ok) throw new Error('API failed')
      return await res.json()
    } catch {
      return null
    }
  },

  /**
   * Describe drawing / sketch
   */
  async describeDrawing(strokeCount: number, labels?: string[]) {
    try {
      const res = await fetch(`${API_BASE}/ai/describe-drawing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strokeCount, labels }),
        signal: AbortSignal.timeout(4000),
      })
      if (!res.ok) throw new Error('API failed')
      return await res.json()
    } catch {
      return null
    }
  },

  /**
   * Fetch documents from server
   */
  async getDocuments(): Promise<BackendDocument[]> {
    try {
      const res = await fetch(`${API_BASE}/documents`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  },

  /**
   * Fetch tasks from server
   */
  async getTasks(): Promise<BackendTask[]> {
    try {
      const res = await fetch(`${API_BASE}/tasks`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  },
}
