import { Controller, Post, Body } from '@nestjs/common'
import { AiService, AskAiResponse, ExtractedTask } from './ai.service'

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  async askNotes(
    @Body() body: { query: string; notebookId?: string }
  ): Promise<AskAiResponse> {
    return this.aiService.askNotes(body.query || '', body.notebookId)
  }

  @Post('extract-tasks')
  async extractTasks(
    @Body() body: { content: string }
  ): Promise<ExtractedTask[]> {
    return this.aiService.extractTasks(body.content || '')
  }

  @Post('describe-drawing')
  async describeDrawing(
    @Body() body: { strokeCount: number; labels?: string[] }
  ): Promise<{ summary: string; formula: string; confidence: number }> {
    return this.aiService.describeDrawing(body.strokeCount || 0, body.labels)
  }
}
