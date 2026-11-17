import { io, Socket } from 'socket.io-client'
import { useAppStore } from '../store/appStore'

class SyncClient {
  private socket: Socket | null = null
  private currentRoomId: string | null = null
  private updateListeners: ((update: string) => void)[] = []
  private peerListeners: ((peers: any[]) => void)[] = []

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

    this.socket.on('crdt-peer-joined', (data: any) => {
      // collaborator joined
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

  onUpdate(callback: (update: string) => void) {
    this.updateListeners.push(callback)
    return () => {
      this.updateListeners = this.updateListeners.filter((fn) => fn !== callback)
    }
  }
}

export const syncClient = new SyncClient()
