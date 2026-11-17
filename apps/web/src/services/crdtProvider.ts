import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { syncClient } from './syncClient'

interface DocumentCRDT {
  pageId: string
  ydoc: Y.Doc
  persistence: IndexeddbPersistence
  unsubscribeUpdate: () => void
}

class CrdtProviderManager {
  private activeDocs = new Map<string, DocumentCRDT>()

  /**
   * Get or initialize a synchronized Y.Doc for a specific note/page
   */
  getOrCreateDoc(pageId: string, initialContent?: string): Y.Doc {
    const existing = this.activeDocs.get(pageId)
    if (existing) {
      return existing.ydoc
    }

    const ydoc = new Y.Doc()

    // 1. Local IndexedDB Persistence (Offline-First)
    const persistence = new IndexeddbPersistence(`second-brain-${pageId}`, ydoc)

    persistence.once('synced', () => {
      // If indexedDB was empty and we have initial content, populate it
      const ytext = ydoc.getText('content')
      if (ytext.length === 0 && initialContent) {
        ytext.insert(0, initialContent)
      }
    })

    // 2. Broadcast local updates to server / peers
    ydoc.on('update', (update: Uint8Array, origin: any) => {
      // Avoid echo loops if the update came from remote sync
      if (origin !== 'remote-sync') {
        const base64 = Buffer.from(update).toString('base64')
        syncClient.sendUpdate(base64)
      }
    })

    // 3. Receive remote updates from server / peers
    const unsubscribeUpdate = syncClient.onUpdate((base64Update: string) => {
      try {
        const binaryUpdate = Buffer.from(base64Update, 'base64')
        Y.applyUpdate(ydoc, binaryUpdate, 'remote-sync')
      } catch (err) {
        console.error('Failed to apply incoming CRDT update:', err)
      }
    })

    this.activeDocs.set(pageId, {
      pageId,
      ydoc,
      persistence,
      unsubscribeUpdate,
    })

    return ydoc
  }

  /**
   * Release document resources when closing page
   */
  destroyDoc(pageId: string) {
    const entry = this.activeDocs.get(pageId)
    if (entry) {
      entry.unsubscribeUpdate()
      entry.persistence.destroy()
      entry.ydoc.destroy()
      this.activeDocs.delete(pageId)
    }
  }
}

export const crdtProvider = new CrdtProviderManager()
