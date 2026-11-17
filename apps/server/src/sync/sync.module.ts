import { Module } from '@nestjs/common'
import { SyncGateway } from './sync.gateway'
import { CrdtRoomManager } from './crdt-room.manager'
import { DocumentsModule } from '../documents/documents.module'

@Module({
  imports: [DocumentsModule],
  providers: [SyncGateway, CrdtRoomManager],
  exports: [SyncGateway, CrdtRoomManager],
})
export class SyncModule {}
