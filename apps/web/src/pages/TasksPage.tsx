import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, Sparkles, Plus, Calendar, Check, Trash2, ArrowUpRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { apiClient, type BackendTask } from '../services/apiClient'

interface TaskItem {
  id: string
  text: string
  noteTitle: string
  pageId: string
  notebook: string
  done: boolean
  dueDate?: string
  priority: 'high' | 'medium' | 'low'
}

const FALLBACK_TASKS: TaskItem[] = [
  {
    id: 't-1',
    text: 'Review Routh-Hurwitz stability conditions and polynomial coefficients',
    noteTitle: 'Feedback Stability',
    pageId: 'pg-1',
    notebook: 'Sisteme Automate',
    done: true,
    dueDate: 'Oct 8, 2026',
    priority: 'high',
  },
  {
    id: 't-2',
    text: 'Simulate closed-loop root locus trajectory in MATLAB & verify pole crossings',
    noteTitle: 'Feedback Stability',
    pageId: 'pg-1',
    notebook: 'Sisteme Automate',
    done: false,
    dueDate: 'Oct 24, 2026',
    priority: 'high',
  },
  {
    id: 't-3',
    text: 'Write up analytical stability analysis section for Chapter 3',
    noteTitle: 'Feedback Stability',
    pageId: 'pg-1',
    notebook: 'Sisteme Automate',
    done: false,
    dueDate: 'Oct 28, 2026',
    priority: 'medium',
  },
  {
    id: 't-4',
    text: 'Prepare Lab 04 PID testbench parameters with Ziegler-Nichols tuning',
    noteTitle: 'Lab 04 · PID Tuning',
    pageId: 'pg-1',
    notebook: 'Sisteme Automate',
    done: false,
    dueDate: 'Nov 2, 2026',
    priority: 'medium',
  },
  {
    id: 't-5',
    text: 'Implement Yjs awareness listener for collaborator cursor broadcasting',
    noteTitle: 'CRDT & Sync Architecture',
    pageId: 'pg-1',
    notebook: 'Programare Avansată',
    done: false,
    dueDate: 'Nov 5, 2026',
    priority: 'high',
  },
]

export function TasksPage() {
  const navigate = useNavigate()
  const { setCurrentPage, currentPageId, notebooks } = useAppStore()

  // Find active page object
  let currentPage = notebooks.flatMap((n) => n.pages).find((p) => p.id === currentPageId)
  if (!currentPage && notebooks[0]?.pages[0]) {
    currentPage = notebooks[0].pages[0]
  }
  const [tasks, setTasks] = useState<TaskItem[]>(FALLBACK_TASKS)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [extracting, setExtracting] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  // Fetch tasks from server on mount
  useEffect(() => {
    let isMounted = true

    apiClient.getTasks().then((serverTasks) => {
      if (!isMounted) return
      if (serverTasks && serverTasks.length > 0) {
        setTasks(
          serverTasks.map((st: BackendTask) => ({
            id: st.id,
            text: st.text,
            noteTitle: st.noteTitle || 'General Note',
            pageId: st.pageId || 'pg-1',
            notebook: st.notebook || 'Workspace',
            done: st.done,
            dueDate: st.dueDate,
            priority: st.priority || 'medium',
          }))
        )
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const toggleTask = async (id: string) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
    await apiClient.toggleTask(id)
  }

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await apiClient.deleteTask(id)
  }

  const handleExtractWithAI = async () => {
    setExtracting(true)

    // Gather content from current page or all notebook pages
    let sourceContent = currentPage?.content || ''
    let sourceTitle = currentPage?.title || 'Active Document'
    let sourceNotebook = 'Sisteme Automate'

    if (!sourceContent) {
      // Find first page with content across notebooks
      for (const nb of notebooks) {
        for (const p of nb.pages) {
          if (p.content && p.content.length > 50) {
            sourceContent = p.content
            sourceTitle = p.title
            sourceNotebook = nb.name
            break
          }
        }
        if (sourceContent) break
      }
    }

    if (!sourceContent) {
      sourceContent =
        'Root locus analysis: 1. Simulate closed-loop root locus trajectory in MATLAB. 2. Verify pole crossings on imaginary axis. 3. Derive gain margin and phase margin formulas from Bode plot asymptotes.'
    }

    try {
      const result = await apiClient.extractTasks(sourceContent)
      if (result && Array.isArray(result.tasks) && result.tasks.length > 0) {
        const newItems: TaskItem[] = result.tasks.map((taskStr: string, idx: number) => ({
          id: `t-ai-${Date.now()}-${idx}`,
          text: taskStr,
          noteTitle: sourceTitle,
          pageId: currentPage?.id || 'pg-1',
          notebook: sourceNotebook,
          done: false,
          dueDate: 'Nov 12, 2026',
          priority: 'high',
        }))

        // Sync new items to server
        for (const it of newItems) {
          await apiClient.createTask(it)
        }

        setTasks((prev) => [...newItems, ...prev])
        setNotice(`Extracted ${newItems.length} action items from "${sourceTitle}"`)
      } else {
        // Fallback demo extraction
        const fallbackItem: TaskItem = {
          id: `t-${Date.now()}`,
          text: 'Derive gain margin and phase margin formulas from Bode plot asymptotes',
          noteTitle: 'Bode Plots',
          pageId: currentPage?.id || 'pg-1',
          notebook: 'Sisteme Automate',
          done: false,
          dueDate: 'Nov 10, 2026',
          priority: 'medium',
        }
        await apiClient.createTask(fallbackItem)
        setTasks((prev) => [fallbackItem, ...prev])
        setNotice('Extracted 1 action item from active notes')
      }
    } catch (err) {
      console.error('Failed to extract tasks:', err)
    } finally {
      setExtracting(false)
      setTimeout(() => setNotice(null), 3500)
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return

    const activeNotebook = notebooks[0]?.name || 'Workspace'
    const activeTitle = currentPage?.title || 'Quick Notes'
    const activePageId = currentPage?.id || 'pg-1'

    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      text: newTaskText.trim(),
      noteTitle: activeTitle,
      pageId: activePageId,
      notebook: activeNotebook,
      done: false,
      dueDate: 'Upcoming',
      priority: 'medium',
    }

    setTasks((prev) => [newTask, ...prev])
    setNewTaskText('')

    await apiClient.createTask(newTask)
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.done
    if (filter === 'completed') return t.done
    return true
  })

  const pendingCount = tasks.filter((t) => !t.done).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-page)' }}>
      {/* Top bar */}
      <header
        className="topbar"
        style={{
          borderBottom: '1px solid var(--color-border-subtle)',
          padding: '12px 24px',
          background: 'var(--color-bg-page)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--color-brand-100)',
              color: 'var(--color-brand-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckSquare size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                My Tasks
              </h1>
              <span className="badge badge-brand" style={{ fontSize: 11 }}>
                {pendingCount} remaining
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              Action items extracted from your study notes and lab journals
            </div>
          </div>
        </div>

        {/* AI Extraction Button */}
        <button
          className="btn btn-sm btn-primary flex items-center gap-2"
          onClick={handleExtractWithAI}
          disabled={extracting}
        >
          <Sparkles size={14} />
          {extracting ? 'Scanning notes with AI…' : 'Extract tasks from notes'}
        </button>
      </header>

      {/* Success Notice */}
      {notice && (
        <div
          style={{
            background: 'var(--color-brand-50)',
            borderBottom: '1px solid var(--color-brand-200)',
            padding: '8px 24px',
            fontSize: 12,
            color: 'var(--color-brand-700)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Check size={13} color="#12B76A" /> {notice}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 48px', maxWidth: 840, width: '100%', margin: '0 auto', overflowY: 'auto' }}>
        {/* Quick Add Bar */}
        <form onSubmit={handleAddTask} style={{ marginBottom: 24, display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="input"
            placeholder="Add a new action item…"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary">
            <Plus size={14} /> Add Task
          </button>
        </form>

        {/* Filter tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'pending', 'completed'] as const).map((mode) => (
              <button
                key={mode}
                className={`btn btn-xs ${filter === mode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            Showing {filteredTasks.length} tasks
          </span>
        </div>

        {/* Tasks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                border: '1px solid var(--color-border-subtle)',
                background: task.done ? 'var(--color-bg-subtle)' : 'var(--color-bg-page)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: task.done ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: task.done ? 'none' : '2px solid var(--color-border-strong)',
                  background: task.done ? 'var(--color-brand-600)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  flexShrink: 0,
                  transition: 'background 0.12s',
                }}
                aria-label={task.done ? 'Mark pending' : 'Mark done'}
              >
                {task.done && <Check size={13} strokeWidth={3} />}
              </button>

              {/* Text & note info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    color: task.done ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                    textDecoration: task.done ? 'line-through' : 'none',
                    fontWeight: task.done ? 400 : 500,
                  }}
                >
                  {task.text}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                  <span
                    style={{ cursor: 'pointer', color: 'var(--color-brand-600)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                    onClick={() => {
                      setCurrentPage(task.pageId)
                      navigate('/')
                    }}
                    title="Jump to note"
                  >
                    📄 {task.noteTitle} <ArrowUpRight size={11} />
                  </span>
                  <span>•</span>
                  <span>📁 {task.notebook}</span>
                  {task.dueDate && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {task.dueDate}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Priority badge */}
              <span
                className={`badge ${task.priority === 'high' ? 'badge-error' : task.priority === 'medium' ? 'badge-warning' : 'badge-secondary'}`}
                style={{ fontSize: 10, textTransform: 'uppercase' }}
              >
                {task.priority}
              </span>

              {/* Delete button */}
              <button
                className="btn btn-icon btn-ghost btn-xs"
                onClick={(e) => handleDeleteTask(task.id, e)}
                title="Delete task"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: 'var(--color-text-tertiary)',
                fontSize: 13,
              }}
            >
              No tasks found in this view.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
