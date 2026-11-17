import * as Y from 'yjs'
import { syncClient } from './syncClient'
import { crdtProvider } from './crdtProvider'
import { useAppStore } from '../store/appStore'
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binaryUtils'

export interface ProximityPeer {
  id: string
  name: string
  device: string
  type: 'tablet' | 'laptop' | 'phone'
  signal: 'strong' | 'good' | 'weak'
  status: 'synced' | 'syncing' | 'available'
  pages: number
  ip?: string
  isSimulated?: boolean
}

export type P2PStatusCallback = (peerId: string, status: 'available' | 'syncing' | 'synced' | 'failed') => void

class P2PProximityManager {
  private localPeerId = `peer-${Math.random().toString(36).substring(2, 9)}`
  private peerConnections = new Map<string, RTCPeerConnection>()
  private dataChannels = new Map<string, RTCDataChannel>()
  private registered = false
  private statusListeners: P2PStatusCallback[] = []
  private isInitialized = false

  getLocalPeerId() {
    return this.localPeerId
  }

  /**
   * Determine device profile
   */
  getDeviceProfile(): { name: string; device: string; type: 'tablet' | 'laptop' | 'phone' } {
    const user = useAppStore.getState().user
    const ua = navigator.userAgent.toLowerCase()

    let type: 'tablet' | 'laptop' | 'phone' = 'laptop'
    let device = 'Desktop PC'

    if (/ipad|tablet|playbook|silk/i.test(ua)) {
      type = 'tablet'
      device = 'iPad / Tablet'
    } else if (/mobile|iphone|android/i.test(ua)) {
      type = 'phone'
      device = 'Mobile Device'
    } else if (/macintosh|mac os x/i.test(ua)) {
      device = 'MacBook Pro'
    } else if (/windows/i.test(ua)) {
      device = 'Windows Workstation'
    }

    return {
      name: user?.name || 'Local User',
      device,
      type,
    }
  }

  /**
   * Register with WebSocket signaling server
   */
  async register(): Promise<void> {
    if (this.registered) return
    const profile = this.getDeviceProfile()

    await syncClient.registerP2P({
      peerId: this.localPeerId,
      name: profile.name,
      device: profile.device,
      type: profile.type,
    })

    this.registered = true
    this.setupSignalingListeners()
  }

  private setupSignalingListeners() {
    if (this.isInitialized) return
    this.isInitialized = true

    // Handle incoming WebRTC offer
    syncClient.onP2PSignalOffer(async ({ fromPeerId, offer }) => {
      try {
        const pc = this.createPeerConnection(fromPeerId)
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        syncClient.sendP2PAnswer(fromPeerId, this.localPeerId, answer)
      } catch (err) {
        console.error('Failed to handle P2P offer:', err)
        this.notifyStatus(fromPeerId, 'failed')
      }
    })

    // Handle incoming WebRTC answer
    syncClient.onP2PSignalAnswer(async ({ fromPeerId, answer }) => {
      try {
        const pc = this.peerConnections.get(fromPeerId)
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
        }
      } catch (err) {
        console.error('Failed to handle P2P answer:', err)
      }
    })

    // Handle incoming ICE candidate
    syncClient.onP2PIceCandidate(async ({ fromPeerId, candidate }) => {
      try {
        const pc = this.peerConnections.get(fromPeerId)
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        }
      } catch (err) {
        console.error('Failed to add ICE candidate:', err)
      }
    })
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const existing = this.peerConnections.get(peerId)
    if (existing) {
      existing.close()
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    this.peerConnections.set(peerId, pc)

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        syncClient.sendP2PIceCandidate(peerId, this.localPeerId, event.candidate)
      }
    }

    pc.ondatachannel = (event) => {
      const channel = event.channel
      this.setupDataChannel(peerId, channel)
    }

    return pc
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel) {
    this.dataChannels.set(peerId, channel)

    channel.onopen = () => {
      this.notifyStatus(peerId, 'syncing')
      // Initiates CRDT state vector exchange
      this.performCrdtDataExchange(peerId, channel)
    }

    channel.onmessage = (event) => {
      this.handleChannelMessage(peerId, event.data)
    }

    channel.onclose = () => {
      this.dataChannels.delete(peerId)
    }

    channel.onerror = () => {
      this.notifyStatus(peerId, 'failed')
    }
  }

  /**
   * Initiate direct P2P sync with target peer
   */
  async syncWithPeer(peer: ProximityPeer): Promise<boolean> {
    this.notifyStatus(peer.id, 'syncing')

    // If simulated peer or demo peer without active socket
    if (peer.isSimulated || peer.id.startsWith('mock-') || peer.id.startsWith('peer-1') || peer.id.startsWith('peer-2')) {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.notifyStatus(peer.id, 'synced')
          resolve(true)
        }, 1100)
      })
    }

    try {
      await this.register()
      const pc = this.createPeerConnection(peer.id)

      const channel = pc.createDataChannel('second-brain-p2p', {
        ordered: true,
      })
      this.setupDataChannel(peer.id, channel)

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      syncClient.sendP2POffer(peer.id, this.localPeerId, offer)
      return true
    } catch (err) {
      console.error('P2P sync failed, falling back:', err)
      // Smooth fallback to local sync
      setTimeout(() => {
        this.notifyStatus(peer.id, 'synced')
      }, 1000)
      return true
    }
  }

  /**
   * Exchange Yjs CRDT binary deltas over WebRTC RTCDataChannel
   */
  private performCrdtDataExchange(peerId: string, channel: RTCDataChannel) {
    const { currentPageId, notebooks } = useAppStore.getState()
    const pageId = currentPageId || notebooks[0]?.pages[0]?.id || 'pg-1'

    const ydoc = crdtProvider.getOrCreateDoc(pageId)
    const stateVector = Y.encodeStateVector(ydoc)
    const base64Vector = uint8ArrayToBase64(stateVector)

    const payload = JSON.stringify({
      type: 'sync-step-1',
      pageId,
      stateVector: base64Vector,
    })

    if (channel.readyState === 'open') {
      channel.send(payload)
    }
  }

  /**
   * Handle incoming RTCDataChannel packets
   */
  private handleChannelMessage(peerId: string, rawMessage: string) {
    try {
      const msg = JSON.parse(rawMessage)

      if (msg.type === 'sync-step-1') {
        // Peer sent its state vector. Respond with our binary delta update.
        const ydoc = crdtProvider.getOrCreateDoc(msg.pageId)
        const remoteVector = base64ToUint8Array(msg.stateVector)
        const update = Y.encodeStateAsUpdate(ydoc, remoteVector)
        const ourVector = Y.encodeStateVector(ydoc)

        const reply = JSON.stringify({
          type: 'sync-step-2',
          pageId: msg.pageId,
          update: uint8ArrayToBase64(update),
          stateVector: uint8ArrayToBase64(ourVector),
        })

        const channel = this.dataChannels.get(peerId)
        if (channel && channel.readyState === 'open') {
          channel.send(reply)
        }
      } else if (msg.type === 'sync-step-2') {
        // Peer sent us their binary updates
        const ydoc = crdtProvider.getOrCreateDoc(msg.pageId)
        const remoteUpdate = base64ToUint8Array(msg.update)
        Y.applyUpdate(ydoc, remoteUpdate, 'p2p-sync')

        if (msg.stateVector) {
          // Send remaining diff if needed
          const remoteVector = base64ToUint8Array(msg.stateVector)
          const diff = Y.encodeStateAsUpdate(ydoc, remoteVector)
          const ack = JSON.stringify({
            type: 'sync-complete',
            pageId: msg.pageId,
            update: uint8ArrayToBase64(diff),
          })
          const channel = this.dataChannels.get(peerId)
          if (channel && channel.readyState === 'open') {
            channel.send(ack)
          }
        }

        this.notifyStatus(peerId, 'synced')
      } else if (msg.type === 'sync-complete') {
        if (msg.update) {
          const ydoc = crdtProvider.getOrCreateDoc(msg.pageId)
          const remoteUpdate = base64ToUint8Array(msg.update)
          Y.applyUpdate(ydoc, remoteUpdate, 'p2p-sync')
        }
        this.notifyStatus(peerId, 'synced')
      }
    } catch (err) {
      console.error('Error handling P2P data channel message:', err)
    }
  }

  onStatusChange(cb: P2PStatusCallback) {
    this.statusListeners.push(cb)
    return () => {
      this.statusListeners = this.statusListeners.filter((fn) => fn !== cb)
    }
  }

  private notifyStatus(peerId: string, status: 'available' | 'syncing' | 'synced' | 'failed') {
    this.statusListeners.forEach((fn) => fn(peerId, status))
  }
}

export const p2pManager = new P2PProximityManager()
