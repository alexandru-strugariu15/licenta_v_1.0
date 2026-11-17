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

interface RoomPeer {
  socketId: string
  peerId: string
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

  // Map of document room -> Set of socket IDs
  private documentRooms = new Map<string, Set<string>>()

  // Map of P2P signaling room -> Map of peerId -> RoomPeer
  private p2pRooms = new Map<string, Map<string, RoomPeer>>()

  afterInit() {
    this.logger.log('WebSocket Sync & WebRTC Signaling Gateway initialized')
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)

    // Clean up document rooms
    for (const [roomId, sockets] of this.documentRooms.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id)
        client.to(roomId).emit('crdt-peer-left', { socketId: client.id })
        if (sockets.size === 0) {
          this.documentRooms.delete(roomId)
        }
      }
    }

    // Clean up P2P signaling rooms
    for (const [roomId, peers] of this.p2pRooms.entries()) {
      for (const [peerId, peer] of peers.entries()) {
        if (peer.socketId === client.id) {
          peers.delete(peerId)
          client.to(`p2p:${roomId}`).emit('webrtc-peer-disconnected', { peerId })
          this.logger.log(`P2P peer disconnected: ${peerId} from room ${roomId}`)
          if (peers.size === 0) {
            this.p2pRooms.delete(roomId)
          }
          break
        }
      }
    }
  }

  // --- CRDT Multiplayer Relay ---

  @SubscribeMessage('crdt-join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId?: string }
  ) {
    const { roomId, userId } = data
    client.join(roomId)

    if (!this.documentRooms.has(roomId)) {
      this.documentRooms.set(roomId, new Set())
    }
    this.documentRooms.get(roomId).add(client.id)

    this.logger.log(`Client ${client.id} joined document room: ${roomId}`)

    // Notify room of new peer
    client.to(roomId).emit('crdt-peer-joined', {
      socketId: client.id,
      userId: userId || 'anonymous',
    })

    return {
      status: 'joined',
      roomId,
      activeClients: this.documentRooms.get(roomId).size,
    }
  }

  @SubscribeMessage('crdt-update')
  handleCrdtUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; update: any }
  ) {
    // Relay CRDT binary update or state vector delta to all other clients in room
    client.to(payload.roomId).emit('crdt-update', {
      senderId: client.id,
      update: payload.update,
      timestamp: Date.now(),
    })
  }

  @SubscribeMessage('crdt-awareness')
  handleCrdtAwareness(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; awareness: any }
  ) {
    // Relay cursor position, selection, user info
    client.to(payload.roomId).emit('crdt-awareness', {
      senderId: client.id,
      awareness: payload.awareness,
    })
  }

  // --- WebRTC P2P Proximity Signaling ---

  @SubscribeMessage('webrtc-join')
  handleWebRtcJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; peerId: string }
  ) {
    const { roomId, peerId } = data
    const roomChannel = `p2p:${roomId}`
    client.join(roomChannel)

    if (!this.p2pRooms.has(roomId)) {
      this.p2pRooms.set(roomId, new Map())
    }

    const peersInRoom = this.p2pRooms.get(roomId)
    const existingPeerIds = Array.from(peersInRoom.keys())

    peersInRoom.set(peerId, {
      socketId: client.id,
      peerId,
      joinedAt: Date.now(),
    })

    this.logger.log(`WebRTC Peer ${peerId} joined signaling room: ${roomId}`)

    // Tell newcomer about existing peers
    client.emit('webrtc-existing-peers', { peers: existingPeerIds })

    // Tell existing peers about newcomer
    client.to(roomChannel).emit('webrtc-peer-joined', { peerId })

    return { status: 'joined', roomId, peersCount: peersInRoom.size }
  }

  @SubscribeMessage('webrtc-offer')
  handleWebRtcOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; targetPeerId: string; offer: any; fromPeerId: string }
  ) {
    const peers = this.p2pRooms.get(data.roomId)
    const target = peers?.get(data.targetPeerId)
    if (target) {
      this.server.to(target.socketId).emit('webrtc-offer', {
        fromPeerId: data.fromPeerId,
        offer: data.offer,
      })
    }
  }

  @SubscribeMessage('webrtc-answer')
  handleWebRtcAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; targetPeerId: string; answer: any; fromPeerId: string }
  ) {
    const peers = this.p2pRooms.get(data.roomId)
    const target = peers?.get(data.targetPeerId)
    if (target) {
      this.server.to(target.socketId).emit('webrtc-answer', {
        fromPeerId: data.fromPeerId,
        answer: data.answer,
      })
    }
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleWebRtcIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; targetPeerId: string; candidate: any; fromPeerId: string }
  ) {
    const peers = this.p2pRooms.get(data.roomId)
    const target = peers?.get(data.targetPeerId)
    if (target) {
      this.server.to(target.socketId).emit('webrtc-ice-candidate', {
        fromPeerId: data.fromPeerId,
        candidate: data.candidate,
      })
    }
  }
}
