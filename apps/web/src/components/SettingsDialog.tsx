import { useState } from 'react'
import {
  X, User as UserIcon, Wifi, Sparkles, Download, Check,
  Server, Shield, RefreshCw, HardDrive, Sliders
} from 'lucide-react'
import { useAppStore, DEMO_NOTEBOOKS } from '../store/appStore'

type Tab = 'account' | 'sync' | 'ai' | 'export'

interface SettingsDialogProps {
  onClose: () => void
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const {
    user, currentWorkspace, settings, updateSettings,
    notebooks, setSyncStatus
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<Tab>('sync')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Local state for settings form
  const [syncServerUrl, setSyncServerUrl] = useState(settings.syncServerUrl)
  const [enableP2P, setEnableP2P] = useState(settings.enableP2P)
  const [p2pSignalingUrl, setP2pSignalingUrl] = useState(settings.p2pSignalingUrl)
  const [aiProvider, setAiProvider] = useState(settings.aiProvider)
  const [aiApiKey, setAiApiKey] = useState(settings.aiApiKey)
  const [aiModel, setAiModel] = useState(settings.aiModel)
  const [autoSummarize, setAutoSummarize] = useState(settings.autoSummarize)
  const [chunkSize, setChunkSize] = useState(settings.chunkSize)

  const totalPages = notebooks.reduce((acc, nb) => acc + nb.pages.length, 0)

  const handleSave = () => {
    updateSettings({
      syncServerUrl,
      enableP2P,
      p2pSignalingUrl,
      aiProvider,
      aiApiKey,
      aiModel,
      autoSummarize,
      chunkSize,
    })
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notebooks, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `second-brain-backup-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleExportMarkdown = () => {
    let mdContent = `# Second Brain Notes Export\nDate: ${new Date().toLocaleDateString()}\n\n`
    notebooks.forEach((nb) => {
      mdContent += `## 📁 Notebook: ${nb.emoji} ${nb.name}\n\n`
      nb.pages.forEach((p) => {
        mdContent += `### 📄 ${p.icon} ${p.title}\n`
        mdContent += `Updated: ${new Date(p.updatedAt).toLocaleString()}\n\n`
        mdContent += `${(p.content || '').replace(/<[^>]*>/g, '')}\n\n---\n\n`
      })
    })

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `second-brain-notes-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleResetDemo = () => {
    if (window.confirm('Reset all notebooks and pages to default academic demo content?')) {
      useAppStore.setState({ notebooks: DEMO_NOTEBOOKS, currentPageId: 'pg-1', currentNotebookId: 'nb-1' })
      onClose()
    }
  }

  return (
    <div className="dialog-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="dialog-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 680,
          maxWidth: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 16,
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border-subtle)',
            background: 'var(--color-bg-page)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--color-brand-100)',
                color: 'var(--color-brand-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sliders size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Preferences & Settings
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                Configure sync relay, WebRTC P2P mesh, and AI Co-pilot
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Body with sidebar tabs */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 420 }}>
          {/* Settings Tabs */}
          <div
            style={{
              width: 190,
              borderRight: '1px solid var(--color-border-subtle)',
              background: 'var(--color-bg-subtle)',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {[
              { id: 'sync' as Tab, label: 'Sync & P2P', icon: Wifi },
              { id: 'ai' as Tab, label: 'AI & Co-pilot', icon: Sparkles },
              { id: 'account' as Tab, label: 'Account & Storage', icon: UserIcon },
              { id: 'export' as Tab, label: 'Export & Backup', icon: Download },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: activeTab === id ? 600 : 500,
                  color: activeTab === id ? 'var(--color-brand-700)' : 'var(--color-text-secondary)',
                  background: activeTab === id ? 'var(--color-brand-50)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', background: 'var(--color-bg-page)' }}>
            {activeTab === 'sync' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    Real-time CRDT Relay Server
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 10 }}>
                    WebSocket endpoint for live multiplayer synchronization and persistence (NestJS / Hocuspocus).
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="input"
                      value={syncServerUrl}
                      onChange={(e) => setSyncServerUrl(e.target.value)}
                      placeholder="ws://localhost:3001"
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSyncStatus('syncing')
                        setTimeout(() => setSyncStatus('synced'), 700)
                      }}
                    >
                      <RefreshCw size={13} />
                      Test
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Enable Offline P2P Proximity Sync
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                        Allows nearby devices on the same Wi-Fi or ad-hoc hotspot to sync directly via WebRTC without internet.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableP2P}
                      onChange={(e) => setEnableP2P(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </div>

                  {enableP2P && (
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Local Signaling Server URL
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={p2pSignalingUrl}
                        onChange={(e) => setP2pSignalingUrl(e.target.value)}
                        placeholder="ws://localhost:3001/signaling"
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Server size={18} style={{ color: 'var(--color-brand-600)', flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    <strong>Protocol:</strong> Binary CRDT diffs using <code>Y.encodeStateAsUpdate()</code>. Edits merge conflict-free under high latency.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    AI Provider & LLM Engine
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 12 }}>
                    Used by the right-hand Co-pilot for note-grounded RAG, task extraction, and handwriting recognition.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                    {[
                      { id: 'openai', label: 'OpenAI', desc: 'GPT-4o & text-embedding' },
                      { id: 'anthropic', label: 'Anthropic', desc: 'Claude 3.5 Sonnet' },
                      { id: 'local', label: 'Local (Ollama)', desc: 'Llama 3 / DeepSeek' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAiProvider(p.id as any)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: aiProvider === p.id ? '2px solid var(--color-brand-600)' : '1px solid var(--color-border-default)',
                          background: aiProvider === p.id ? 'var(--color-brand-50)' : 'var(--color-bg-page)',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{p.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                      API Key {aiProvider === 'local' ? '(Optional for Local)' : ''}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="password"
                        className="input"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder={aiProvider === 'openai' ? 'sk-...' : aiProvider === 'anthropic' ? 'sk-ant-...' : 'http://localhost:11434'}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        Chat Model
                      </label>
                      <select
                        className="input"
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="gpt-4o-mini">GPT-4o mini (Recommended)</option>
                        <option value="gpt-4o">GPT-4o (Multimodal)</option>
                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                        <option value="llama3:8b">Llama 3 8B (Local)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                        RAG Chunk Size (Tokens)
                      </label>
                      <input
                        type="number"
                        className="input"
                        value={chunkSize}
                        onChange={(e) => setChunkSize(Number(e.target.value))}
                        style={{ width: '100%' }}
                        min={100}
                        max={1000}
                        step={50}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        Automatic Action Item Extraction
                      </span>
                      <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                        Automatically parses phrases like "Review by Thursday" into the My Tasks board.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSummarize}
                      onChange={(e) => setAutoSummarize(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                    User Profile
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: 14,
                      background: 'var(--color-bg-subtle)',
                      borderRadius: 10,
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div className="avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
                      {user?.initials || 'AS'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {user?.name || 'Alexandru Strugariu'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                        {user?.email || 'alex@example.com'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-brand-600)', fontWeight: 500, marginTop: 2 }}>
                        Workspace: {currentWorkspace?.name || 'Licență UNSTPB'} ({currentWorkspace?.kind || 'university'})
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                    Local Storage & Offline Index
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div style={{ padding: 12, background: 'var(--color-bg-subtle)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Total Notebooks</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4 }}>
                        {notebooks.length}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--color-bg-subtle)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Indexed Pages</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 4 }}>
                        {totalPages}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--color-bg-subtle)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Local DB Engine</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-brand-600)', marginTop: 6 }}>
                        IndexedDB (Yjs)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    Export Universal Archives
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 14 }}>
                    Download complete snapshot of your second brain in vendor-independent formats.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
                      onClick={handleExportMarkdown}
                    >
                      <Download size={16} style={{ color: 'var(--color-brand-600)' }} />
                      <div style={{ textAlign: 'left', marginLeft: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          Export as Markdown (.md)
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                          Clean text format with frontmatter, compatible with Obsidian and Notion
                        </div>
                      </div>
                    </button>

                    <button
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
                      onClick={handleExportJSON}
                    >
                      <HardDrive size={16} style={{ color: '#0BA5EC' }} />
                      <div style={{ textAlign: 'left', marginLeft: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          Export as JSON Backup
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                          Raw structural JSON containing all notebooks, pages, metadata, and canvas ink data
                        </div>
                      </div>
                    </button>

                    <button
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
                      onClick={() => window.print()}
                    >
                      <Shield size={16} style={{ color: '#12B76A' }} />
                      <div style={{ textAlign: 'left', marginLeft: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          Print or Save PDF
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                          Generate print-ready PDF of the current view using browser engine
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: '#B42318', marginBottom: 4 }}>
                    Demo Data Reset
                  </h4>
                  <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                    Re-seed notebooks and pages with the default Control Systems & Advanced Programming lecture sets.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#B42318' }}
                    onClick={handleResetDemo}
                  >
                    Reset Demo Content
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border-subtle)',
            background: 'var(--color-bg-subtle)',
          }}
        >
          {saveSuccess ? (
            <span style={{ fontSize: 12, color: '#067647', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Check size={14} /> Settings saved successfully
            </span>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              Second Brain v1.0 • UNSTPB Bachelor's Project
            </span>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
