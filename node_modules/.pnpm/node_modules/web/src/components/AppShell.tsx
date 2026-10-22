import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { EditorPage } from '../pages/EditorPage'
import { KnowledgeGraphPage } from '../pages/KnowledgeGraphPage'
import { TasksPage } from '../pages/TasksPage'
import { CopilotPanel } from './CopilotPanel'
import { SearchDialog } from './SearchDialog'
import { useAppStore } from '../store/appStore'
import { useEffect } from 'react'

export function AppShell() {
  const { theme, searchOpen, copilotOpen } = useAppStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        useAppStore.getState().setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-content">
        <Routes>
          <Route path="/" element={<EditorPage />} />
          <Route path="/page/:pageId" element={<EditorPage />} />
          <Route path="/graph" element={<KnowledgeGraphPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Routes>
      </div>

      {copilotOpen && <CopilotPanel />}
      {searchOpen && <SearchDialog />}
    </div>
  )
}
