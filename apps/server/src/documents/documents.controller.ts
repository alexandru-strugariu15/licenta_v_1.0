import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common'
import { DocumentsService, ServerDocument } from './documents.service'

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  getAll(): ServerDocument[] {
    return this.documentsService.findAll()
  }

  @Get(':id')
  getById(@Param('id') id: string): ServerDocument {
    return this.documentsService.findById(id)
  }

  @Post()
  create(@Body() body: Partial<ServerDocument>): ServerDocument {
    return this.documentsService.create(body)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: Partial<ServerDocument>
  ): ServerDocument {
    return this.documentsService.update(id, body)
  }

  @Delete(':id')
  delete(@Param('id') id: string): { success: boolean } {
    return this.documentsService.delete(id)
  }
}
