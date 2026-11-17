import { Module } from '@nestjs/common'
import { SyncModule } from './sync/sync.module'
import { DocumentsModule } from './documents/documents.module'
import { AiModule } from './ai/ai.module'
import { TasksModule } from './tasks/tasks.module'
import { HealthController } from './health/health.controller'

@Module({
  imports: [
    SyncModule,
    DocumentsModule,
    AiModule,
    TasksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
