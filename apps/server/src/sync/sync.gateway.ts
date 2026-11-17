import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { CrdtRoomManager, RoomPeerInfo } from './crdt-room.manager'

interface P2PPeer {
  socketId: string
  peerId: string
  name: string
  device: string
  type: 'tablet' | 'laptop' | 'phone'
  joinedAt: number
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SyncGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(SyncGateway.name)

  // Map of socketId -> Set of document rooms joined
  private clientJoinedRooms = new Map<string, Set<string>>()

  // Map of peerId -> P2PPeer
  private proximityPeers = new Map<string, P2PPeer>()

  constructor(private readonly crdtRoomManager: CrdtRoomManager) {}

  afterInit() {
    this.logger.log('CRDT & WebRTC Signaling Gateway initialized with full Yjs Sync Protocol')
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
    this.clientJoinedRooms.set(client.id, new Set())
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)

    // Clean up CRDT document rooms
    const joined = this.clientJoinedRooms.get(client.id)
    if (joined) {
      for (const roomId of joined) {
        this.crdtRoomManager.removePeer(roomId, client.id)
        client.to(roomId).emit('crdt-peer-left', { socketId: client.id })
      }
      this.clientJoinedRooms.delete(client.id)
    }

    // Clean up P2P proximity peers
    for (const [peerId, peer] of this.proximityPeers.entries()) {
      if (peer.socketId === client.id) {
        this.proximityPeers.delete(peerId)
        this.server.emit('p2p-peer-lost', { peerId })
        this.logger.log(`P2P proximity peer lost: ${peer.name} (${peerId})`)
        break
      }
    }
  }

  // ===========================================================================
  // CRDT Yjs Protocol Handlers
  // ===========================================================================

  /**
   * Client joins a document room.
   * Server sends back its state vector and initial peers list.
   */
  @SubscribeMessage('crdt-join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; user?: { id: string; name: string; color: string } }
  ) {
    const { roomId, user } = data
    client.join(roomId)

    // Track client's joined rooms
    const joined = this.clientJoinedRooms.get(client.id) || new Set()
    joined.add(roomId)
    this.clientJoinedRooms.set(client.id, joined)

    const peerInfo: RoomPeerInfo = {
      socketId: client.id,
      userId: user?.id || `user-${client.id.slice(0, 5)}`,
      userName: user?.name || 'Anonymous Contributor',
      userColor: user?.color || '#7F56D9',
    }

    const peersInRoom = this.crdtRoomManager.addPeer(roomId, peerInfo)

    // Notify other peers in room
    client.to(roomId).emit('crdt-peer-joined', { peer: peerInfo })

    // Calculate server's state vector for SyncStep1
    const serverStateVector = this.crdtRoomManager.encodeStateVector(roomId)
    const base64StateVector = Buffer.from(serverStateVector).toString('base64')

    return {
      status: 'joined',
      roomId,
      serverStateVector: base64StateVector,
      peers: peersInRoom,
    }
  }

  /**
   * Yjs SyncStep1: Client sends its state vector.
   * Server responds with the binary diff (SyncStep2).
   */
  @SubscribeMessage('crdt-sync-step-1')
  handleSyncStep1(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; stateVector: string }
  ) {
    const { roomId, stateVector } = data
    const clientVectorBuffer = Buffer.from(stateVector, 'base64')
    const diffUpdate = this.crdtRoomManager.encodeDiffAgainstStateVector(roomId, clientVectorBuffer)

    return {
      roomId,
      update: Buffer.from(diffUpdate).toString('base64'),
    }
  }

  /**
   * Yjs Update: Client committed character or stroke edits.
   * Server merges update into Y.Doc and relays to all peers.
   */
  @SubscribeMessage('crdt-update')
  handleCrdtUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; update: string }
  ) {
    const { roomId, update } = payload
    const updateBuffer = Buffer.from(update, 'base64')

    // Apply to server's Y.Doc (in-memory + debounced persistence)
    this.crdtRoomManager.applyClientUpdate(roomId, updateBuffer, client.id)

    // Relay to other room members
    client.to(roomId).emit('crdt-update', {
      senderId: client.id,
      update,
      timestamp: Date.now(),
    })

    return { status: 'acknowledged' }
  }

  /**
   * Live Awareness: broadcasting collaborator cursors, selection, typing status.
   */
  @SubscribeMessage('crdt-awareness')
  handleCrdtAwareness(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; awareness: any }
  ) {
    this.crdtRoomManager.updatePeerAwareness(payload.roomId, client.id, payload.awareness)

    client.to(payload.roomId).emit('crdt-awareness', {
      senderId: client.id,
      awareness: payload.awareness,
    })
  }

  // ===========================================================================
  // WebRTC P2P Proximity Signaling Handlers
  // ===========================================================================

  /**
   * Register local device in the P2P proximity radar
   */
  @SubscribeMessage('p2p-register')
  handleP2pRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { peerId: string; name: string; device: string; type: 'tablet' | 'laptop' | 'phone' }
  ) {
    const peer: P2PPeer = {
      socketId: client.id,
      peerId: data.peerId,
      name: data.name,
      device: data.device,
      type: data.type,
      joinedAt: Date.now(),
    }

    this.proximityPeers.set(data.peerId, peer)
    this.logger.log(`P2P peer registered: ${peer.name} on ${peer.device}`)

    // Broadcast new peer to everyone on local network
    client.broadcast.emit('p2p-peer-discovered', peer)

    return {
      status: 'registered',
      peers: Array.from(this.proximityPeers.values()).filter((p) => p.peerId !== data.peerId),
    }
  }

  /**
   * Get active proximity peers
   */
  @SubscribeMessage('p2p-list-peers')
  handleP2pListPeers() {
    return Array.from(this.proximityPeers.values())
  }

  /**
   * Relay WebRTC SDP Offer to target peer
   */
  @SubscribeMessage('p2p-signal-offer')
  handleP2pSignalOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetPeerId: string; fromPeerId: string; offer: any }
  ) {
    const target = this.proximityPeers.get(data.targetPeerId)
    if (target) {
      this.server.to(target.socketId).emit('p2p-signal-offer', {
        fromPeerId: data.fromPeerId,
        offer: data.offer,
      })
    }
  }

  /**
   * Relay WebRTC SDP Answer back to originating peer
   */
  @SubscribeMessage('p2p-signal-answer')
  handleP2pSignalAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetPeerId: string; fromPeerId: string; answer: any }
  ) {
    const target = this.proximityPeers.get(data.targetPeerId)
    if (target) {
      this.server.to(target.socketId).emit('p2p-signal-answer', {
        fromPeerId: data.fromPeerId,
        answer: data.answer,
      })
    }
  }

  /**
   * Relay WebRTC ICE Candidate between peers
   */
  @SubscribeMessage('p2p-ice-candidate')
  handleP2pIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetPeerId: string; fromPeerId: string; candidate: any }
  ) {
    const target = this.proximityPeers.get(data.targetPeerId)
    if (target) {
      this.server.to(target.socketId).emit('p2p-ice-candidate', {
        fromPeerId: data.fromPeerId,
        candidate: data.candidate,
      })
    }
  }
}
