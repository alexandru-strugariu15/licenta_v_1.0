import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'

export interface ServerTask {
  id: string
  text: string
  pageId: string
  noteTitle: string
  notebook: string
  done: boolean
  dueDate?: string
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name)
  private tasks = new Map<string, ServerTask>()
  private dataDir = path.resolve(process.cwd(), '.data')
  private dataFile = path.join(this.dataDir, 'tasks.json')

  constructor() {
    this.initStorage()
  }

  private initStorage() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true })
      }

      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf-8')
        const parsed: ServerTask[] = JSON.parse(raw)
        parsed.forEach((t) => this.tasks.set(t.id, t))
        this.logger.log(`Loaded ${parsed.length} tasks from persistent store (${this.dataFile})`)
        return
      }
    } catch (err) {
      this.logger.warn(`Failed to read tasks store: ${err.message}`)
    }

    this.seedDemoTasks()
    this.saveToDisk()
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true })
      }
      const data = Array.from(this.tasks.values())
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2), 'utf-8')
    } catch (err) {
      this.logger.error(`Failed to write tasks store: ${err.message}`)
    }
  }

  private seedDemoTasks() {
    const demo: ServerTask[] = [
      {
        id: 't-1',
        text: 'Review Routh-Hurwitz stability conditions and polynomial coefficients',
        pageId: 'pg-1',
        noteTitle: 'Feedback Stability',
        notebook: 'Sisteme Automate',
        done: true,
        dueDate: 'Oct 8, 2026',
        priority: 'high',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't-2',
        text: 'Simulate closed-loop root locus trajectory in MATLAB & verify pole crossings',
        pageId: 'pg-1',
        noteTitle: 'Feedback Stability',
        notebook: 'Sisteme Automate',
        done: false,
        dueDate: 'Oct 24, 2026',
        priority: 'high',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't-3',
        text: 'Write up analytical stability analysis section for Chapter 3',
        pageId: 'pg-1',
        noteTitle: 'Feedback Stability',
        notebook: 'Sisteme Automate',
        done: false,
        dueDate: 'Oct 28, 2026',
        priority: 'medium',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't-4',
        text: 'Prepare Lab 04 PID testbench parameters with Ziegler-Nichols tuning',
        pageId: 'pg-1',
        noteTitle: 'Feedback Stability',
        notebook: 'Sisteme Automate',
        done: false,
        dueDate: 'Nov 2, 2026',
        priority: 'medium',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't-5',
        text: 'Implement Yjs awareness listener for collaborator cursor broadcasting',
        pageId: 'pg-5',
        noteTitle: 'CRDT & Sync',
        notebook: 'Programare Avansată',
        done: true,
        dueDate: 'Nov 6, 2026',
        priority: 'high',
        createdAt: new Date().toISOString(),
      },
    ]

    for (const t of demo) {
      this.tasks.set(t.id, t)
    }
  }

  findAll(): ServerTask[] {
    return Array.from(this.tasks.values())
  }

  create(task: Partial<ServerTask>): ServerTask {
    const id = task.id || `task-${Date.now()}`
    const newTask: ServerTask = {
      id,
      text: task.text || '',
      pageId: task.pageId || 'pg-1',
      noteTitle: task.noteTitle || 'General Notes',
      notebook: task.notebook || 'General',
      done: task.done || false,
      dueDate: task.dueDate,
      priority: task.priority || 'medium',
      createdAt: new Date().toISOString(),
    }
    this.tasks.set(id, newTask)
    this.saveToDisk()
    return newTask
  }

  toggle(id: string): ServerTask {
    const task = this.tasks.get(id)
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`)
    }
    task.done = !task.done
    this.tasks.set(id, task)
    this.saveToDisk()
    return task
  }

  delete(id: string): { success: boolean } {
    if (!this.tasks.has(id)) {
      throw new NotFoundException(`Task with ID ${id} not found`)
    }
    this.tasks.delete(id)
    this.saveToDisk()
    return { success: true }
  }
}
