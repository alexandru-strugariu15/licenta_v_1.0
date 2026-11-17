import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Share2, Sparkles, Menu, Wifi, WifiOff, Loader,
  MoreHorizontal, Pencil, Download, Printer, Trash2, Check,
  X
} from 'lucide-react'
import { RichEditor } from '../components/RichEditor'
import { CanvasBlock } from '../components/CanvasBlock'
import { useAppStore } from '../store/appStore'

const PAGE_ICONS = ['📄', '📊', '📈', '✏️', '🏗️', '🔄', '💡', '📚', '🎯', '⚙️', '🔬', '🧮', '💻', '⚡', '🧠', '🛡️']

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
]

export function EditorPage() {
  const { pageId: routePageId } = useParams<{ pageId?: string }>()
  const navigate = useNavigate()

  const {
    notebooks, currentPageId, currentNotebookId,
    setCurrentPage, setCurrentNotebook, updatePage, deletePage,
    toggleCopilot, copilotOpen, toggleSidebar, sidebarCollapsed,
    syncStatus, setProximityOpen
  } = useAppStore()

  // Sync route param with store
  useEffect(() => {
    if (routePageId && routePageId !== currentPageId) {
      setCurrentPage(routePageId)
      const foundNb = notebooks.find((nb) => nb.pages.some((p) => p.id === routePageId))
      if (foundNb && foundNb.id !== currentNotebookId) {
        setCurrentNotebook(foundNb.id)
      }
    }
  }, [routePageId, currentPageId, currentNotebookId, notebooks, setCurrentPage, setCurrentNotebook])

  const currentNotebook = notebooks.find((nb) =>
    nb.pages.some((p) => p.id === (routePageId || currentPageId))
  ) || notebooks.find((nb) => nb.id === currentNotebookId) || notebooks[0]

  const currentPage = currentNotebook?.pages.find((p) => p.id === (routePageId || currentPageId)) || currentNotebook?.pages[0]

  const activeNotebookId = currentNotebook?.id || 'nb-1'
  const activePageId = currentPage?.id || 'pg-1'

  const [title, setTitle] = useState(currentPage?.title ?? 'Untitled')
  const [pageIcon, setPageIcon] = useState(currentPage?.icon ?? '📄')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Keep local title/icon in sync when active page changes
  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title)
      setPageIcon(currentPage.icon)
    }
  }, [activePageId, currentPage?.title, currentPage?.icon])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    updatePage(activeNotebookId, activePageId, { title: newTitle })
  }

  const handleIconSelect = (icon: string) => {
    setPageIcon(icon)
    updatePage(activeNotebookId, activePageId, { icon })
    setShowIconPicker(false)
  }

  const handleCoverSelect = (coverGradient: string) => {
    updatePage(activeNotebookId, activePageId, { cover: coverGradient })
    setShowCoverPicker(false)
  }

  const handleRemoveCover = () => {
    updatePage(activeNotebookId, activePageId, { cover: undefined })
    setShowCoverPicker(false)
  }

  const handleToggleCanvas = () => {
    const nextState = !currentPage?.showCanvas
    updatePage(activeNotebookId, activePageId, { showCanvas: nextState })
  }

  const handleExportMarkdown = () => {
    const content = `# ${currentPage?.icon || '📄'} ${currentPage?.title || 'Note'}\n\n` +
      `*Notebook: ${currentNotebook?.name}*\n` +
      `*Last updated: ${new Date(currentPage?.updatedAt || Date.now()).toLocaleString()}*\n\n` +
      `${(currentPage?.content || '').replace(/<[^>]*>/g, '')}`

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(currentPage?.title || 'note').toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setShowMoreMenu(false)
  }

  const handleDeleteCurrentPage = () => {
    setShowMoreMenu(false)
    if (window.confirm(`Are you sure you want to delete "${currentPage?.title}"?`)) {
      deletePage(activeNotebookId, activePageId)
      navigate('/')
    }
  }

  const handleCopyShareLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const SyncIcon = syncStatus === 'syncing' ? Loader : syncStatus === 'offline' ? WifiOff : Wifi
  const syncColor = {
    synced: '#067647', syncing: '#B54708', offline: 'var(--color-text-tertiary)', error: '#B42318',
  }[syncStatus]

  return (
    <div className="editor-container" style={{ position: 'relative' }}>
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
          <span className="breadcrumb-item">{currentNotebook?.name ?? 'Sisteme Automate'}</span>
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
                title="Maya Chen (collaborating via CRDT)"
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
                title="Radu Popescu (collaborating via WebRTC)"
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
          <div className="sync-badge" style={{ color: syncColor }}>
            <SyncIcon
              size={11}
              className={syncStatus === 'syncing' ? 'animate-spin' : ''}
            />
            <span style={{ color: syncColor }}>
              {syncStatus === 'synced' ? 'Page synced' : syncStatus === 'syncing' ? 'Saving…' : syncStatus === 'offline' ? 'Offline' : 'Error'}
            </span>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={() => setShowShareModal(true)}>
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

          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => setShowMoreMenu((v) => !v)}
              aria-label="More options"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMoreMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 200,
                  background: 'var(--color-bg-page)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 10,
                  boxShadow: 'var(--shadow-lg)',
                  padding: 4,
                  zIndex: 100,
                }}
              >
                <button
                  className="sidebar-nav-item"
                  style={{ width: '100%', border: 'none', padding: '8px 12px', fontSize: 13 }}
                  onClick={handleExportMarkdown}
                >
                  <Download size={14} style={{ marginRight: 8 }} />
                  Export Markdown
                </button>
                <button
                  className="sidebar-nav-item"
                  style={{ width: '100%', border: 'none', padding: '8px 12px', fontSize: 13 }}
                  onClick={() => { setShowMoreMenu(false); window.print() }}
                >
                  <Printer size={14} style={{ marginRight: 8 }} />
                  Print / PDF
                </button>
                <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                <button
                  className="sidebar-nav-item"
                  style={{ width: '100%', border: 'none', padding: '8px 12px', fontSize: 13, color: '#B42318' }}
                  onClick={handleDeleteCurrentPage}
                >
                  <Trash2 size={14} style={{ marginRight: 8 }} />
                  Delete page
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Editor scroll area */}
      <main className="editor-scroll" id="editor-main">
        {/* Cover banner if enabled */}
        {currentPage?.cover && (
          <div
            style={{
              height: 160,
              width: '100%',
              background: currentPage.cover,
              position: 'relative',
              borderRadius: '0 0 12px 12px',
            }}
          >
            <button
              className="btn btn-secondary btn-xs"
              style={{ position: 'absolute', bottom: 12, right: 16, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowCoverPicker(true)}
            >
              Change cover
            </button>
          </div>
        )}

        <article className="editor-page" style={{ paddingTop: currentPage?.cover ? 24 : 40 }}>
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
                    padding: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
                  }}
                >
                  {PAGE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => handleIconSelect(icon)}
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
            <div style={{ display: 'flex', gap: 14, marginBottom: 8, alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-xs"
                style={{ fontSize: 12, color: 'var(--color-text-tertiary)', padding: 0 }}
                onClick={() => setShowIconPicker((v) => !v)}
              >
                😀 Change icon
              </button>
              <button
                className="btn btn-ghost btn-xs"
                style={{ fontSize: 12, color: 'var(--color-text-tertiary)', padding: 0 }}
                onClick={() => setShowCoverPicker(true)}
              >
                🖼️ {currentPage?.cover ? 'Change cover' : 'Add cover'}
              </button>
            </div>

            {/* Cover picker popover */}
            {showCoverPicker && (
              <div
                style={{
                  padding: 12,
                  background: 'var(--color-bg-page)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-md)',
                  marginBottom: 16,
                  maxWidth: 420,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>Select Cover Style</span>
                  {currentPage?.cover && (
                    <button
                      className="btn btn-ghost btn-xs"
                      style={{ color: '#B42318' }}
                      onClick={handleRemoveCover}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {COVER_GRADIENTS.map((gradient, idx) => (
                    <div
                      key={idx}
                      style={{
                        height: 48,
                        borderRadius: 8,
                        background: gradient,
                        cursor: 'pointer',
                        border: currentPage?.cover === gradient ? '2px solid var(--color-brand-600)' : '1px solid rgba(0,0,0,0.1)',
                      }}
                      onClick={() => handleCoverSelect(gradient)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <textarea
              className="page-title-input"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
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
                Lecture Note
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                {new Date(currentPage?.updatedAt || Date.now()).toLocaleDateString()}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>·</span>
              <div className="page-meta-chip" style={{ fontSize: 12 }}>
                <span style={{ color: '#12B76A' }}>●</span>
                <span>Yjs CRDT Active</span>
              </div>
              {currentNotebook && (
                <div className="page-meta-chip" style={{ fontSize: 12 }}>
                  {currentNotebook.emoji} {currentNotebook.name}
                </div>
              )}
            </div>
          </header>

          {/* Toggle canvas */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className={`btn btn-sm ${currentPage?.showCanvas ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleToggleCanvas}
            >
              <Pencil size={13} />
              {currentPage?.showCanvas ? 'Hide drawing canvas' : 'Open drawing canvas'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              (Stroke-level CRDT ink layer)
            </span>
          </div>

          {/* Canvas Block */}
          {currentPage?.showCanvas && (
            <div style={{ marginBottom: 24 }}>
              <CanvasBlock
                initialStrokes={currentPage?.canvasStrokes || []}
                onStrokesChange={(strokes) => {
                  updatePage(activeNotebookId, activePageId, { canvasStrokes: strokes })
                }}
              />
            </div>
          )}

          {/* Rich text editor keyed by pageId so content resets properly per page */}
          <RichEditor
            key={activePageId}
            content={currentPage?.content}
            onChange={(html) => {
              updatePage(activeNotebookId, activePageId, { content: html })
            }}
            placeholder="Write something, or press '/' for commands…"
          />
        </article>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="dialog-overlay" onClick={() => setShowShareModal(false)} style={{ zIndex: 1000 }}>
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 440, padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Share & Collaborate</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowShareModal(false)}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              Share this note for real-time collaborative editing or peer-to-peer sync.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                Direct Web Link
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="input"
                  readOnly
                  value={window.location.href}
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleCopyShareLink}>
                  {copiedLink ? <Check size={14} /> : 'Copy'}
                </button>
              </div>
            </div>

            <div
              style={{
                background: 'var(--color-brand-50)',
                border: '1px solid var(--color-brand-200)',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand-800)', marginBottom: 4 }}>
                Offline Proximity Peer Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: 'var(--color-brand-700)' }}>
                  849-204
                </span>
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => {
                    setShowShareModal(false)
                    setProximityOpen(true)
                  }}
                >
                  Open Radar
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowShareModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
