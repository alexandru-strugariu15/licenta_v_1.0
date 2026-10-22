import {
  Search, FileText, GitBranch, CheckSquare, Settings,
  Wifi, WifiOff, Loader, ChevronRight, ChevronDown,
  Plus, Menu, Moon, Sun, Sparkles, Radio
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ProximitySyncDialog } from './ProximitySyncDialog'

export function Sidebar() {
  const {
    sidebarCollapsed, toggleSidebar, copilotOpen, toggleCopilot,
    notebooks, currentPageId, currentNotebookId,
    setCurrentPage, setCurrentNotebook,
    syncStatus, offlineChanges,
    user, logout, theme, setTheme, setSearchOpen
  } = useAppStore()

  const navigate = useNavigate()
  const location = useLocation()
  const [proximityOpen, setProximityOpen] = useState(false)
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set(['nb-1']))

  const toggleNotebook = (id: string) => {
    setExpandedNotebooks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
          <div className="sidebar-section-label">Notebooks</div>
          {notebooks.map((notebook) => {
            const isExpanded = expandedNotebooks.has(notebook.id)
            const isActive = notebook.id === currentNotebookId

            return (
              <div key={notebook.id}>
                <button
                  className={`sidebar-nav-item ${isActive && location.pathname === '/' ? 'active' : ''}`}
                  style={{ width: '100%', border: 'none' }}
                  onClick={() => {
                    toggleNotebook(notebook.id)
                    setCurrentNotebook(notebook.id)
                  }}
                >
                  <span style={{ fontSize: 14 }}>{notebook.emoji}</span>
                  <span className="item-label">{notebook.name}</span>
                  {isExpanded
                    ? <ChevronDown size={13} style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.5 }} />
                    : <ChevronRight size={13} style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.5 }} />
                  }
                </button>

                {isExpanded && notebook.pages.map((page) => (
                  <button
                    key={page.id}
                    className={`notebook-item notebook-item-indent ${currentPageId === page.id && location.pathname === '/' ? 'active' : ''}`}
                    style={{ width: '100%', border: 'none' }}
                    onClick={() => {
                      setCurrentPage(page.id)
                      setCurrentNotebook(notebook.id)
                      navigate('/')
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{page.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {page.title}
                    </span>
                  </button>
                ))}
              </div>
            )
          })}

          <button
            className="sidebar-nav-item"
            style={{ width: '100%', border: 'none', opacity: 0.6 }}
            onClick={() => {}}
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
        className="sidebar-nav-item"
        style={{ margin: '0 8px 4px', width: 'calc(100% - 16px)', border: 'none' }}
        onClick={() => {}}
      >
        <Settings className="icon" size={16} />
        <span className="item-label">Settings</span>
      </button>

      {/* User */}
      <div className="sidebar-user" onClick={logout}>
        <div className="avatar">
          {user?.initials ?? 'U'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name ?? 'User'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? ''}
          </div>
        </div>
      </div>

      {proximityOpen && <ProximitySyncDialog onClose={() => setProximityOpen(false)} />}
    </aside>
  )
}
