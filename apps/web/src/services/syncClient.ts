import { io, Socket } from 'socket.io-client'
import { useAppStore } from '../store/appStore'

class SyncClient {
  private socket: Socket | null = null
  private currentRoomId: string | null = null
  private updateListeners: ((update: string) => void)[] = []
  private strokeListeners: ((stroke: any) => void)[] = []
  private liveStrokeListeners: ((data: { senderId: string; points: [number, number, number][] }) => void)[] = []
  private peerListeners: ((peers: any[]) => void)[] = []
  private p2pDiscoveredListeners: ((peer: any) => void)[] = []
  private p2pOfferListeners: ((data: { fromPeerId: string; offer: any }) => void)[] = []
  private p2pAnswerListeners: ((data: { fromPeerId: string; answer: any }) => void)[] = []
  private p2pIceListeners: ((data: { fromPeerId: string; candidate: any }) => void)[] = []

  init() {
    if (this.socket) return

    const serverUrl = useAppStore.getState().settings.syncServerUrl.replace(/^ws:\/\//, 'http://')

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 4000,
    })

    this.socket.on('connect', () => {
      useAppStore.getState().setSyncStatus('synced')
      if (this.currentRoomId) {
        this.rejoinCurrentRoom()
      }
    })

    this.socket.on('disconnect', () => {
      useAppStore.getState().setSyncStatus('offline')
    })

    this.socket.on('connect_error', () => {
      // Silently fall back to offline-first local mode
      useAppStore.getState().setSyncStatus('offline')
    })

    this.socket.on('crdt-update', (data: { update: string }) => {
      this.updateListeners.forEach((fn) => fn(data.update))
    })

    this.socket.on('crdt-stroke', (data: { stroke: any }) => {
      this.strokeListeners.forEach((fn) => fn(data.stroke))
    })

    this.socket.on('crdt-live-stroke', (data: { senderId: string; points: any }) => {
      this.liveStrokeListeners.forEach((fn) => fn(data))
    })

    this.socket.on('crdt-peer-joined', (data: any) => {
      // collaborator joined
    })

    this.socket.on('p2p-peer-discovered', (peer: any) => {
      this.p2pDiscoveredListeners.forEach((fn) => fn(peer))
    })

    this.socket.on('p2p-signal-offer', (data: { fromPeerId: string; offer: any }) => {
      this.p2pOfferListeners.forEach((fn) => fn(data))
    })

    this.socket.on('p2p-signal-answer', (data: { fromPeerId: string; answer: any }) => {
      this.p2pAnswerListeners.forEach((fn) => fn(data))
    })

    this.socket.on('p2p-ice-candidate', (data: { fromPeerId: string; candidate: any }) => {
      this.p2pIceListeners.forEach((fn) => fn(data))
    })
  }

  joinRoom(roomId: string) {
    this.init()
    this.currentRoomId = roomId

    if (this.socket && this.socket.connected) {
      const user = useAppStore.getState().user
      this.socket.emit(
        'crdt-join-room',
        {
          roomId,
          user: user ? { id: user.id, name: user.name, color: '#7F56D9' } : undefined,
        },
        (response: any) => {
          if (response?.peers) {
            this.peerListeners.forEach((fn) => fn(response.peers))
          }
        }
      )
    }
  }

  private rejoinCurrentRoom() {
    if (this.currentRoomId) {
      this.joinRoom(this.currentRoomId)
    }
  }

  sendUpdate(updateBase64: string) {
    if (!this.socket || !this.socket.connected || !this.currentRoomId) return

    useAppStore.getState().setSyncStatus('syncing')
    this.socket.emit(
      'crdt-update',
      {
        roomId: this.currentRoomId,
        update: updateBase64,
      },
      () => {
        useAppStore.getState().setSyncStatus('synced')
      }
    )
  }

  sendAwareness(awarenessData: any) {
    if (!this.socket || !this.socket.connected || !this.currentRoomId) return

    this.socket.emit('crdt-awareness', {
      roomId: this.currentRoomId,
      awareness: awarenessData,
    })
  }

  sendStroke(stroke: any) {
    if (!this.socket || !this.socket.connected || !this.currentRoomId) return
    this.socket.emit('crdt-stroke', {
      roomId: this.currentRoomId,
      stroke,
    })
  }

  sendLiveStroke(points: [number, number, number][]) {
    if (!this.socket || !this.socket.connected || !this.currentRoomId) return
    this.socket.emit('crdt-live-stroke', {
      roomId: this.currentRoomId,
      points,
    })
  }

  onStroke(callback: (stroke: any) => void) {
    this.strokeListeners.push(callback)
    return () => {
      this.strokeListeners = this.strokeListeners.filter((fn) => fn !== callback)
    }
  }

  onLiveStroke(callback: (data: { senderId: string; points: [number, number, number][] }) => void) {
    this.liveStrokeListeners.push(callback)
    return () => {
      this.liveStrokeListeners = this.liveStrokeListeners.filter((fn) => fn !== callback)
    }
  }

  onUpdate(callback: (update: string) => void) {
    this.updateListeners.push(callback)
    return () => {
      this.updateListeners = this.updateListeners.filter((fn) => fn !== callback)
    }
  }

  // ===========================================================================
  // P2P Proximity Signaling Methods
  // ===========================================================================

  registerP2P(peer: { peerId: string; name: string; device: string; type: 'tablet' | 'laptop' | 'phone' }): Promise<any[]> {
    this.init()
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        resolve([])
        return
      }
      this.socket.emit('p2p-register', peer, (res: any) => {
        resolve(res?.peers || [])
      })
    })
  }

  listP2PPeers(): Promise<any[]> {
    this.init()
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        resolve([])
        return
      }
      this.socket.emit('p2p-list-peers', {}, (peers: any[]) => {
        resolve(peers || [])
      })
    })
  }

  sendP2POffer(targetPeerId: string, fromPeerId: string, offer: any) {
    if (!this.socket || !this.socket.connected) return
    this.socket.emit('p2p-signal-offer', { targetPeerId, fromPeerId, offer })
  }

  sendP2PAnswer(targetPeerId: string, fromPeerId: string, answer: any) {
    if (!this.socket || !this.socket.connected) return
    this.socket.emit('p2p-signal-answer', { targetPeerId, fromPeerId, answer })
  }

  sendP2PIceCandidate(targetPeerId: string, fromPeerId: string, candidate: any) {
    if (!this.socket || !this.socket.connected) return
    this.socket.emit('p2p-ice-candidate', { targetPeerId, fromPeerId, candidate })
  }

  onP2PPeerDiscovered(callback: (peer: any) => void) {
    this.p2pDiscoveredListeners.push(callback)
    return () => {
      this.p2pDiscoveredListeners = this.p2pDiscoveredListeners.filter((fn) => fn !== callback)
    }
  }

  onP2PSignalOffer(callback: (data: { fromPeerId: string; offer: any }) => void) {
    this.p2pOfferListeners.push(callback)
    return () => {
      this.p2pOfferListeners = this.p2pOfferListeners.filter((fn) => fn !== callback)
    }
  }

  onP2PSignalAnswer(callback: (data: { fromPeerId: string; answer: any }) => void) {
    this.p2pAnswerListeners.push(callback)
    return () => {
      this.p2pAnswerListeners = this.p2pAnswerListeners.filter((fn) => fn !== callback)
    }
  }

  onP2PIceCandidate(callback: (data: { fromPeerId: string; candidate: any }) => void) {
    this.p2pIceListeners.push(callback)
    return () => {
      this.p2pIceListeners = this.p2pIceListeners.filter((fn) => fn !== callback)
    }
  }
}

export const syncClient = new SyncClient()
