import { Controller, Get } from '@nestjs/common'
import { AiService } from '../ai/ai.service'
import { CrdtRoomManager } from '../sync/crdt-room.manager'
import { DocumentsService } from '../documents/documents.service'

@Controller('health')
export class HealthController {
  private startTime = Date.now()

  constructor(
    private readonly aiService: AiService,
    private readonly crdtRoomManager: CrdtRoomManager,
    private readonly documentsService: DocumentsService
  ) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'second-brain-crdt-backend',
      version: '1.0.0',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      stats: {
        activeCrdtRooms: this.crdtRoomManager.getRoomStats().length,
        totalStoredDocuments: this.documentsService.findAll().length,
      },
      features: {
        crdtYjsSyncStep12: true,
        webrtcMeshSignaling: true,
        ragVectorRetrieval: true,
        strokeLevelSync: true,
        debouncedSnapshotCommit: true,
      },
    }
  }

  @Get('schema')
  getSchema() {
    return {
      database: 'PostgreSQL + pgvector (Supabase)',
      schemaSql: this.aiService.getSchemaSQL(),
    }
  }

  @Get('crdt-rooms')
  getCrdtRooms() {
    return this.crdtRoomManager.getRoomStats()
  }
}
