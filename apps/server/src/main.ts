import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger } from '@nestjs/common'

async function bootstrap() {
  const logger = new Logger('SecondBrainServer')
  const app = await NestFactory.create(AppModule)

  // Global prefix for REST routes
  app.setGlobalPrefix('api')

  // Enable CORS for frontend web client
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  })

  const port = process.env.PORT || 3001
  await app.listen(port)

  logger.log(`Second Brain Backend & CRDT Relay Server running on http://localhost:${port}`)
  logger.log(`REST API Base: http://localhost:${port}/api`)
  logger.log(`WebSocket Gateway: ws://localhost:${port}`)
}

bootstrap()
