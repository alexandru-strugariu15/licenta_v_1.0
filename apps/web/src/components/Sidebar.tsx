import {
  Search, FileText, GitBranch, CheckSquare, Settings,
  Wifi, WifiOff, Loader, ChevronRight, ChevronDown,
  Plus, Menu, Moon, Sun, Sparkles, Radio, Trash2, X
} from 'lucide-react'
import { useAppStore, type Page, type Notebook } from '../store/appStore'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ProximitySyncDialog } from './ProximitySyncDialog'
import { SettingsDialog } from './SettingsDialog'

const EMOJI_OPTIONS = ['🤖', '💻', '🧠', '🔬', '📚', '📐', '📊', '⚡', '💡', '🚀', '🎯', '🧪']

export function Sidebar() {
  const {
    sidebarCollapsed, toggleSidebar, copilotOpen, toggleCopilot,
    notebooks, currentPageId, currentNotebookId,
    setCurrentPage, setCurrentNotebook,
    addNotebook, deleteNotebook, addPage, deletePage,
    syncStatus, offlineChanges,
    user, logout, theme, setTheme, setSearchOpen,
    settingsOpen, setSettingsOpen,
    proximityOpen, setProximityOpen,
  } = useAppStore()

  const navigate = useNavigate()
  const location = useLocation()
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set(['nb-1', 'nb-2']))
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [newNotebookEmoji, setNewNotebookEmoji] = useState('📚')

  const toggleNotebook = (id: string) => {
    setExpandedNotebooks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNotebookName.trim()) return

    const newId = `nb-${Date.now()}`
    const pageId = `pg-${Date.now()}`
    const firstPage: Page = {
      id: pageId,
      notebookId: newId,
      title: 'Getting Started',
      icon: '📄',
      updatedAt: new Date().toISOString(),
      content: '<h2>Getting Started</h2><p>Start writing your new notes here…</p>',
    }

    const nb: Notebook = {
      id: newId,
      workspaceId: 'ws-1',
      name: newNotebookName.trim(),
      emoji: newNotebookEmoji,
      pages: [firstPage],
    }

    addNotebook(nb)
    setExpandedNotebooks((prev) => new Set([...prev, newId]))
    setCurrentNotebook(newId)
    setCurrentPage(pageId)
    setNewNotebookName('')
    setShowNewNotebookModal(false)
    navigate(`/page/${pageId}`)
  }

  const handleAddPageToNotebook = (notebookId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newPageId = `pg-${Date.now()}`
    const newPage: Page = {
      id: newPageId,
      notebookId,
      title: 'Untitled Page',
      icon: '📄',
      updatedAt: new Date().toISOString(),
      content: '<h2>Untitled Page</h2><p>Write your thoughts or type / for commands…</p>',
    }

    addPage(notebookId, newPage)
    setExpandedNotebooks((prev) => new Set([...prev, notebookId]))
    setCurrentNotebook(notebookId)
    setCurrentPage(newPageId)
    navigate(`/page/${newPageId}`)
  }

  const handleDeleteNotebook = (notebookId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Delete notebook "${name}" and all its pages?`)) {
      deleteNotebook(notebookId)
    }
  }

  const handleDeletePage = (notebookId: string, pageId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Delete note "${title}"?`)) {
      deletePage(notebookId, pageId)
    }
  }

  const syncLabel = {
    synced: 'Synced',
    syncing: 'Syncing…',
    offline: 'Offline',
    error: 'Sync error',
  }[syncStatus]

  const SyncIcon = syncStatus === 'syncing' ? Loader : syncStatus === 'offline' ? WifiOff : Wifi

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Header / Workspace */}
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={toggleSidebar}>
          <div className="sidebar-logo-icon">
            <Sparkles size={14} color="white" />
          </div>
          <span className="sidebar-logo-text">Second Brain</span>
        </div>
        <button
          className="btn btn-icon btn-ghost"
          onClick={toggleSidebar}
          data-tooltip="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Scrollable navigation */}
      <div className="sidebar-scroll">
        {/* Quick actions */}
        <div className="sidebar-section">
          <button
            className="sidebar-nav-item"
            style={{ width: '100%', border: 'none' }}
            onClick={() => setSearchOpen(true)}
          >
            <Search className="icon" size={16} />
            <span className="item-label">Quick search</span>
            <span className="text-xs" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.6 }}>⌘K</span>
          </button>
        </div>

        <div className="sidebar-divider" />

        {/* Main nav */}
        <div className="sidebar-section">
          <nav>
            {[
              { icon: FileText, label: 'All notes', path: '/' },
              { icon: GitBranch, label: 'Knowledge graph', path: '/graph' },
              { icon: CheckSquare, label: 'My tasks', path: '/tasks', badge: '4' },
            ].map(({ icon: Icon, label, path, badge }) => (
              <button
                key={label}
                className={`sidebar-nav-item ${location.pathname === path ? 'active' : ''}`}
                style={{ width: '100%', border: 'none' }}
                onClick={() => navigate(path)}
              >
                <Icon className="icon" size={16} />
                <span className="item-label">{label}</span>
                {badge && (
                  <span className="badge badge-brand" style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px' }}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-divider" />

        {/* Notebooks tree */}
        <div className="sidebar-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4, marginBottom: 4 }}>
            <span className="sidebar-section-label" style={{ marginBottom: 0 }}>Notebooks</span>
            <button
              className="btn btn-icon btn-ghost"
              style={{ width: 22, height: 22 }}
              onClick={() => setShowNewNotebookModal(true)}
              data-tooltip="Add new notebook"
              aria-label="Add new notebook"
            >
              <Plus size={13} />
            </button>
          </div>

          {notebooks.map((notebook) => {
            const isExpanded = expandedNotebooks.has(notebook.id)
            const isActive = notebook.id === currentNotebookId

            return (
              <div key={notebook.id} style={{ position: 'relative' }} className="group">
                <div
                  className={`sidebar-nav-item ${isActive && (location.pathname === '/' || location.pathname.startsWith('/page/')) ? 'active' : ''}`}
                  style={{ width: '100%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onClick={() => {
                    toggleNotebook(notebook.id)
                    setCurrentNotebook(notebook.id)
                    if (notebook.pages.length > 0) {
                      setCurrentPage(notebook.pages[0].id)
                      navigate(`/page/${notebook.pages[0].id}`)
                    }
                  }}
                >
                  <span style={{ fontSize: 14 }}>{notebook.emoji}</span>
                  <span className="item-label" style={{ fontWeight: 500 }}>{notebook.name}</span>

                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button
                      className="btn btn-icon btn-ghost"
                      style={{ width: 20, height: 20, opacity: 0.6 }}
                      onClick={(e) => handleAddPageToNotebook(notebook.id, e)}
                      title="Add note to this notebook"
                      aria-label="Add page"
                    >
                      <Plus size={12} />
                    </button>
                    {notebooks.length > 1 && (
                      <button
                        className="btn btn-icon btn-ghost"
                        style={{ width: 20, height: 20, opacity: 0.4 }}
                        onClick={(e) => handleDeleteNotebook(notebook.id, notebook.name, e)}
                        title="Delete notebook"
                        aria-label="Delete notebook"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                    {isExpanded
                      ? <ChevronDown size={13} style={{ opacity: 0.5 }} />
                      : <ChevronRight size={13} style={{ opacity: 0.5 }} />
                    }
                  </div>
                </div>

                {isExpanded && notebook.pages.map((page) => (
                  <div
                    key={page.id}
                    className={`notebook-item notebook-item-indent ${currentPageId === page.id && (location.pathname === '/' || location.pathname.startsWith('/page/')) ? 'active' : ''}`}
                    style={{ width: '100%', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      setCurrentPage(page.id)
                      setCurrentNotebook(notebook.id)
                      navigate(`/page/${page.id}`)
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{page.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {page.title}
                    </span>
                    <button
                      className="btn btn-icon btn-ghost"
                      style={{ width: 18, height: 18, opacity: 0.4 }}
                      onClick={(e) => handleDeletePage(notebook.id, page.id, page.title, e)}
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )
          })}

          <button
            className="sidebar-nav-item"
            style={{ width: '100%', border: 'none', opacity: 0.7, marginTop: 4 }}
            onClick={() => setShowNewNotebookModal(true)}
          >
            <Plus className="icon" size={16} />
            <span className="item-label">New notebook</span>
          </button>
        </div>

        <div className="sidebar-divider" />

        {/* Offline/P2P Card */}
        <div style={{ padding: '8px 8px' }}>
          <div
            className="sidebar-sync-card"
            style={{ cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}
            onClick={() => setProximityOpen(true)}
            title="Open Proximity Sync Manager"
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <Radio size={13} style={{ color: 'var(--color-brand-600)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Proximity Sync</span>
              <span
                className="badge badge-brand"
                style={{ marginLeft: 'auto', fontSize: 10 }}
              >
                P2P
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>
              Sync nearby devices without internet
            </p>
          </div>
        </div>
      </div>

      {/* Sync status */}
      <div style={{ padding: '8px 12px' }}>
        <div className="flex items-center gap-2">
          <div className={`sync-status-dot ${syncStatus}`} />
          <SyncIcon size={12} style={{ color: 'var(--color-text-tertiary)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {syncLabel}
            {syncStatus === 'offline' && offlineChanges > 0 && ` · ${offlineChanges} pending`}
          </span>
          <button
            className="btn btn-icon btn-ghost"
            style={{ marginLeft: 'auto', width: 28, height: 28 }}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            data-tooltip={theme === 'light' ? 'Dark mode' : 'Light mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
          </button>
          <button
            className={`btn btn-icon btn-ghost ${copilotOpen ? 'active' : ''}`}
            style={{ width: 28, height: 28 }}
            onClick={toggleCopilot}
            data-tooltip="AI Co-pilot"
            aria-label="Toggle AI Co-pilot"
          >
            <Sparkles size={13} />
          </button>
        </div>
      </div>

      {/* Settings */}
      <button
        className={`sidebar-nav-item ${settingsOpen ? 'active' : ''}`}
        style={{ margin: '0 8px 4px', width: 'calc(100% - 16px)', border: 'none' }}
        onClick={() => setSettingsOpen(true)}
      >
        <Settings className="icon" size={16} />
        <span className="item-label">Settings</span>
      </button>

      {/* User */}
      <div className="sidebar-user" onClick={logout} title="Click to logout">
        <div className="avatar">
          {user?.initials ?? 'U'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name ?? 'Alexandru Strugariu'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? 'alex@example.com'}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {proximityOpen && <ProximitySyncDialog onClose={() => setProximityOpen(false)} />}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}

      {/* Modal: New Notebook */}
      {showNewNotebookModal && (
        <div className="dialog-overlay" onClick={() => setShowNewNotebookModal(false)} style={{ zIndex: 1000 }}>
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 400, padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Create New Notebook</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowNewNotebookModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNotebook}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Choose Emoji
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewNotebookEmoji(emoji)}
                      style={{
                        width: 34,
                        height: 34,
                        fontSize: 18,
                        borderRadius: 8,
                        border: newNotebookEmoji === emoji ? '2px solid var(--color-brand-600)' : '1px solid var(--color-border-default)',
                        background: newNotebookEmoji === emoji ? 'var(--color-brand-50)' : 'var(--color-bg-page)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Notebook Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Inteligență Artificială"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  autoFocus
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowNewNotebookModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!newNotebookName.trim()}
                >
                  Create Notebook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}
