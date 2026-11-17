import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common'
import { TasksService, ServerTask } from './tasks.service'

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getAll(): ServerTask[] {
    return this.tasksService.findAll()
  }

  @Post()
  create(@Body() body: Partial<ServerTask>): ServerTask {
    return this.tasksService.create(body)
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string): ServerTask {
    return this.tasksService.toggle(id)
  }

  @Delete(':id')
  delete(@Param('id') id: string): { success: boolean } {
    return this.tasksService.delete(id)
  }
}
