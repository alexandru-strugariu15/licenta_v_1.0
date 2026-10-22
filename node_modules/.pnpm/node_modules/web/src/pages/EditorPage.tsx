import { useState, useEffect } from 'react'
import {
  Share2, Sparkles, Menu, Wifi, WifiOff, Loader,
  MoreHorizontal, Pencil
} from 'lucide-react'
import { RichEditor } from '../components/RichEditor'
import { CanvasBlock } from '../components/CanvasBlock'
import { useAppStore } from '../store/appStore'

const PAGE_ICONS = ['📄', '📊', '📈', '✏️', '🏗️', '🔄', '💡', '📚', '🎯', '⚙️', '🔬', '🧮']

export function EditorPage() {
  const {
    notebooks, currentPageId, currentNotebookId,
    toggleCopilot, copilotOpen, toggleSidebar, sidebarCollapsed,
    syncStatus
  } = useAppStore()

  const currentNotebook = notebooks.find((nb) => nb.id === currentNotebookId)
  const currentPage = currentNotebook?.pages.find((p) => p.id === currentPageId)

  const [title, setTitle] = useState(currentPage?.title ?? 'Untitled')
  const [pageIcon, setPageIcon] = useState(currentPage?.icon ?? '📄')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showCanvas, setShowCanvas] = useState(false)

  useEffect(() => {
    setTitle(currentPage?.title ?? 'Untitled')
    setPageIcon(currentPage?.icon ?? '📄')
  }, [currentPageId])

  const SyncIcon = syncStatus === 'syncing' ? Loader : syncStatus === 'offline' ? WifiOff : Wifi
  const syncColor = {
    synced: '#067647', syncing: '#B54708', offline: 'var(--color-text-tertiary)', error: '#B42318',
  }[syncStatus]

  return (
    <div className="editor-container">
      {/* Top bar */}
      <header className="topbar">
        {sidebarCollapsed && (
          <button className="btn btn-icon btn-ghost" onClick={toggleSidebar} aria-label="Open sidebar">
            <Menu size={16} />
          </button>
        )}

        {/* Breadcrumb */}
        <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
          <span className="breadcrumb-item" style={{ color: 'var(--color-text-tertiary)' }}>University</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item">{currentNotebook?.name ?? 'Control Systems'}</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item active">{currentPage?.title ?? 'Feedback Stability'}</span>
        </nav>

        {/* Actions */}
        <div className="topbar-actions">
          {/* Live collaborators */}
          <div className="flex items-center gap-2" style={{ marginRight: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: '#EE46BC',
                  color: 'white', fontSize: 10, fontWeight: 700, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-page)',
                  zIndex: 3,
                }}
                title="Maya Chen (collaborating)"
              >
                MC
              </div>
              <div
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: '#0BA5EC',
                  color: 'white', fontSize: 10, fontWeight: 700, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-page)',
                  marginLeft: -8, zIndex: 2,
                }}
                title="Radu Popescu"
              >
                RP
              </div>
              <div
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: 'var(--color-brand-600)',
                  color: 'white', fontSize: 10, fontWeight: 700, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-page)',
                  marginLeft: -8, zIndex: 1,
                }}
                title="Alex (You)"
              >
                AS
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              3 editing
            </span>
          </div>

          {/* Sync status */}
          <div
            className="sync-badge"
            style={{ color: syncColor }}
          >
            <SyncIcon
              size={11}
              className={syncStatus === 'syncing' ? 'animate-spin' : ''}
            />
            <span style={{ color: syncColor }}>
              {syncStatus === 'synced' ? 'Page synced' : syncStatus === 'syncing' ? 'Saving…' : syncStatus === 'offline' ? 'Offline' : 'Error'}
            </span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => {}}>
            <Share2 size={13} />
            Share
          </button>

          <button
            className={`btn btn-sm ${copilotOpen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={toggleCopilot}
          >
            <Sparkles size={13} />
            AI Co-pilot
          </button>

          <button className="btn btn-icon btn-ghost" onClick={() => {}} aria-label="More options">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* Editor scroll area */}
      <main className="editor-scroll" id="editor-main">
        <article className="editor-page">
          {/* Page header */}
          <header className="page-header">
            {/* Icon picker */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                className="page-icon-btn"
                onClick={() => setShowIconPicker((v) => !v)}
                aria-label="Change page icon"
              >
                {pageIcon}
              </button>

              {showIconPicker && (
                <div
                  style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 50,
                    background: 'var(--color-bg-page)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 10, boxShadow: 'var(--shadow-lg)',
                    padding: 8, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4,
                  }}
                >
                  {PAGE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => { setPageIcon(icon); setShowIconPicker(false) }}
                      style={{
                        width: 36, height: 36, fontSize: 20, border: 'none', background: 'transparent',
                        borderRadius: 6, cursor: 'pointer', transition: 'background 0.1s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Optional page decoration */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
              <button
                className="btn btn-ghost btn-xs"
                style={{ fontSize: 12, color: 'var(--color-text-tertiary)', padding: 0 }}
                onClick={() => setShowIconPicker((v) => !v)}
              >
                😀 Add icon
              </button>
              <button
                className="btn btn-ghost btn-xs"
                style={{ fontSize: 12, color: 'var(--color-text-tertiary)', padding: 0 }}
                onClick={() => {}}
              >
                🖼️ Add cover
              </button>
            </div>

            {/* Title */}
            <textarea
              className="page-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              rows={1}
              aria-label="Page title"
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = el.scrollHeight + 'px'
              }}
            />

            {/* Page meta badges */}
            <div className="page-meta" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <span
                style={{
                  background: 'var(--color-brand-50)',
                  color: 'var(--color-brand-700)',
                  border: '1px solid var(--color-brand-200)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                Lecture 06
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                Oct 5, 2026
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>·</span>
              <div className="page-meta-chip" style={{ fontSize: 12 }}>
                <span style={{ color: '#12B76A' }}>●</span>
                <span>Page synced</span>
              </div>
              {currentNotebook && (
                <div className="page-meta-chip" style={{ fontSize: 12 }}>
                  {currentNotebook.emoji} {currentNotebook.name}
                </div>
              )}
            </div>

            {/* Subtitle / Lead statement */}
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: 'var(--color-text-secondary)',
                marginTop: 14,
                marginBottom: 4,
              }}
            >
              How do we know a feedback system will settle rather than oscillate or diverge? Start with the closed-loop poles, then check the stability margins.
            </p>
          </header>

          {/* Toggle canvas */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <button
              className={`btn btn-sm ${showCanvas ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowCanvas((v) => !v)}
            >
              <Pencil size={13} />
              {showCanvas ? 'Hide drawing' : 'Add drawing'}
            </button>
          </div>

          {/* Canvas Block */}
          {showCanvas && (
            <div style={{ marginBottom: 24 }}>
              <CanvasBlock />
            </div>
          )}

          {/* Rich text editor */}
          <RichEditor
            placeholder="Write something, or press '/' for commands…"
          />
        </article>
      </main>
    </div>
  )
}
