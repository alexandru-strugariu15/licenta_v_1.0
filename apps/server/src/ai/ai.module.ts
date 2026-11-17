import { Module } from '@nestjs/common'
import { AiService } from './ai.service'
import { AiController } from './ai.controller'
import { VectorStoreService } from './vector-store.service'
import { DocumentsModule } from '../documents/documents.module'

@Module({
  imports: [DocumentsModule],
  controllers: [AiController],
  providers: [AiService, VectorStoreService],
  exports: [AiService, VectorStoreService],
})
export class AiModule {}
