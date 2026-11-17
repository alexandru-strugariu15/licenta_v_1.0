import { Controller, Get } from '@nestjs/common'

@Controller('health')
export class HealthController {
  private startTime = Date.now()

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'second-brain-crdt-backend',
      version: '1.0.0',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      features: {
        crdtRelay: true,
        webrtcSignaling: true,
        ragVectorRetrieval: true,
        strokeLevelSync: true,
      },
    }
  }
}
