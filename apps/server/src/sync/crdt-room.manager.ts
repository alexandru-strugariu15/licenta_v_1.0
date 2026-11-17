import { Injectable, Logger } from '@nestjs/common'
import * as Y from 'yjs'
import { DocumentsService } from '../documents/documents.service'

export interface RoomPeerInfo {
  socketId: string
  userId: string
  userName: string
  userColor: string
  cursor?: { x: number; y: number }
}

export interface ActiveDocumentRoom {
  documentId: string
  ydoc: Y.Doc
  peers: Map<string, RoomPeerInfo>
  saveTimeout?: NodeJS.Timeout
  lastSavedAt: number
}

@Injectable()
export class CrdtRoomManager {
  private readonly logger = new Logger(CrdtRoomManager.name)
  private rooms = new Map<string, ActiveDocumentRoom>()

  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Get or initialize an active in-memory Yjs Document room
   */
  getOrCreateRoom(documentId: string): ActiveDocumentRoom {
    let room = this.rooms.get(documentId)
    if (!room) {
      const ydoc = new Y.Doc({ gc: true })

      // Attempt to load existing snapshot from database/documents service
      try {
        const existingDoc = this.documentsService.findById(documentId)
        if (existingDoc && existingDoc.ydocState) {
          const binaryUpdate = Buffer.from(existingDoc.ydocState, 'base64')
          Y.applyUpdate(ydoc, binaryUpdate)
          this.logger.log(`Loaded persisted Yjs snapshot for document: ${documentId}`)
        } else if (existingDoc && existingDoc.content) {
          // Initialize Yjs XmlFragment/Text from HTML/plain text if no snapshot exists yet
          const ytext = ydoc.getText('content')
          ytext.insert(0, existingDoc.content)
        }
      } catch (err) {
        this.logger.warn(`Could not preload document ${documentId}: ${err.message}`)
      }

      room = {
        documentId,
        ydoc,
        peers: new Map(),
        lastSavedAt: Date.now(),
      }

      // Listen for document updates to schedule debounced persistence
      ydoc.on('update', (update: Uint8Array, origin: any) => {
        this.scheduleSnapshotSave(documentId)
      })

      this.rooms.set(documentId, room)
      this.logger.log(`Initialized active CRDT room for document: ${documentId}`)
    }

    return room
  }

  /**
   * Encode current state vector of the server's Y.Doc for document
   */
  encodeStateVector(documentId: string): Uint8Array {
    const room = this.getOrCreateRoom(documentId)
    return Y.encodeStateVector(room.ydoc)
  }

  /**
   * Calculate binary delta update against a client's state vector (SyncStep2)
   */
  encodeDiffAgainstStateVector(documentId: string, clientStateVector: Uint8Array): Uint8Array {
    const room = this.getOrCreateRoom(documentId)
    return Y.encodeStateAsUpdate(room.ydoc, clientStateVector)
  }

  /**
   * Apply an incoming client binary update to the server's Y.Doc
   */
  applyClientUpdate(documentId: string, update: Uint8Array, origin?: string): Uint8Array {
    const room = this.getOrCreateRoom(documentId)
    Y.applyUpdate(room.ydoc, update, origin)
    return update
  }

  /**
   * Add a peer to a document room
   */
  addPeer(documentId: string, peer: RoomPeerInfo) {
    const room = this.getOrCreateRoom(documentId)
    room.peers.set(peer.socketId, peer)
    return Array.from(room.peers.values())
  }

  /**
   * Remove a peer from a document room
   */
  removePeer(documentId: string, socketId: string) {
    const room = this.rooms.get(documentId)
    if (!room) return []

    room.peers.delete(socketId)

    // If room is empty, do a final save
    if (room.peers.size === 0) {
      this.commitSnapshotNow(documentId)
    }

    return Array.from(room.peers.values())
  }

  /**
   * Update peer cursor position or awareness state
   */
  updatePeerAwareness(documentId: string, socketId: string, awarenessData: Partial<RoomPeerInfo>) {
    const room = this.rooms.get(documentId)
    if (!room) return null

    const peer = room.peers.get(socketId)
    if (peer) {
      Object.assign(peer, awarenessData)
      return peer
    }
    return null
  }

  /**
   * Debounced save of Yjs document snapshot to database
   */
  private scheduleSnapshotSave(documentId: string) {
    const room = this.rooms.get(documentId)
    if (!room) return

    if (room.saveTimeout) {
      clearTimeout(room.saveTimeout)
    }

    // Debounce save by 3 seconds
    room.saveTimeout = setTimeout(() => {
      this.commitSnapshotNow(documentId)
    }, 3000)
  }

  /**
   * Commit Yjs document state as binary base64 snapshot and extracted content
   */
  commitSnapshotNow(documentId: string) {
    const room = this.rooms.get(documentId)
    if (!room) return

    if (room.saveTimeout) {
      clearTimeout(room.saveTimeout)
      room.saveTimeout = undefined
    }

    try {
      const stateUpdate = Y.encodeStateAsUpdate(room.ydoc)
      const base64State = Buffer.from(stateUpdate).toString('base64')

      // Extract text content from Y.Text or Y.XmlFragment
      const ytext = room.ydoc.getText('content')
      const textContent = ytext.toString()

      this.documentsService.update(documentId, {
        ydocState: base64State,
        content: textContent || undefined,
      })

      room.lastSavedAt = Date.now()
      this.logger.log(`Persisted Yjs binary snapshot for doc: ${documentId} (${stateUpdate.byteLength} bytes)`)
    } catch (err) {
      this.logger.error(`Failed to commit snapshot for ${documentId}: ${err.message}`)
    }
  }

  getRoomStats() {
    const stats = []
    for (const [id, room] of this.rooms.entries()) {
      stats.push({
        documentId: id,
        activePeers: room.peers.size,
        lastSavedAt: new Date(room.lastSavedAt).toISOString(),
      })
    }
    return stats
  }
}
