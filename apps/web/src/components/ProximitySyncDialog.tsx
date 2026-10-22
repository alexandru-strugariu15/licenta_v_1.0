import { useState } from 'react'
import { Radio, X, Shield, QrCode, Smartphone, Laptop, Check, RefreshCw, Copy } from 'lucide-react'

interface Peer {
  id: string
  name: string
  device: string
  type: 'tablet' | 'laptop' | 'phone'
  signal: 'strong' | 'good' | 'weak'
  status: 'synced' | 'syncing' | 'available'
  pages: number
  ip: string
}

const INITIAL_PEERS: Peer[] = [
  {
    id: 'peer-1',
    name: 'Maya Chen',
    device: 'iPad Pro 11"',
    type: 'tablet',
    signal: 'strong',
    status: 'synced',
    pages: 3,
    ip: '192.168.1.42:6190',
  },
  {
    id: 'peer-2',
    name: 'Radu Popescu',
    device: 'MacBook Air M2',
    type: 'laptop',
    signal: 'good',
    status: 'available',
    pages: 2,
    ip: '192.168.1.78:6190',
  },
]

interface ProximitySyncDialogProps {
  onClose: () => void
}

export function ProximitySyncDialog({ onClose }: ProximitySyncDialogProps) {
  const [enabled, setEnabled] = useState(true)
  const [peers, setPeers] = useState<Peer[]>(INITIAL_PEERS)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const pairCode = '849-204'

  const handleSyncWith = (peerId: string) => {
    setSyncingId(peerId)
    setTimeout(() => {
      setPeers((prev) =>
        prev.map((p) => (p.id === peerId ? { ...p, status: 'synced' } : p))
      )
      setSyncingId(null)
    }, 1200)
  }

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(pairCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'var(--color-bg-page)',
          borderRadius: 16,
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7F56D9 0%, #6941C6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Radio size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Proximity Sync
                </h3>
                <span className="badge badge-brand" style={{ fontSize: 10 }}>P2P WebRTC</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                Sync notes directly with nearby peers on LAN without internet
              </p>
            </div>
          </div>
          <button
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status bar */}
        <div
          style={{
            padding: '12px 24px',
            background: enabled ? 'rgba(105, 65, 198, 0.06)' : 'var(--color-bg-subtle)',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: enabled ? '#12B76A' : '#94A3B8',
                boxShadow: enabled ? '0 0 0 3px rgba(18, 183, 106, 0.2)' : 'none',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {enabled ? 'Broadcasting on local network' : 'Proximity discovery paused'}
            </span>
          </div>

          <button
            className={`btn btn-xs ${enabled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setEnabled(!enabled)}
          >
            {enabled ? 'Active' : 'Turn On'}
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Nearby peers list */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Discovered Peers ({peers.length})
              </span>
              <button
                className="btn btn-xs btn-ghost"
                style={{ fontSize: 11 }}
                onClick={() => {}}
              >
                <RefreshCw size={11} /> Rescan
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {peers.map((peer) => {
                const isSyncing = syncingId === peer.id
                return (
                  <div
                    key={peer.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid var(--color-border-subtle)',
                      background: 'var(--color-bg-subtle)',
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
                          background: 'var(--color-bg-page)',
                          border: '1px solid var(--color-border-default)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-brand-600)',
                        }}
                      >
                        {peer.type === 'tablet' ? <Smartphone size={16} /> : <Laptop size={16} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {peer.name}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                            ({peer.device})
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'flex', gap: 10, marginTop: 2 }}>
                          <span>Signal: {peer.signal}</span>
                          <span>•</span>
                          <span>{peer.pages} shared notes</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {peer.status === 'synced' && !isSyncing ? (
                        <span className="badge badge-success flex items-center gap-1" style={{ fontSize: 11 }}>
                          <Check size={11} /> Synced
                        </span>
                      ) : (
                        <button
                          className="btn btn-xs btn-primary flex items-center gap-1"
                          disabled={isSyncing}
                          onClick={() => handleSyncWith(peer.id)}
                        >
                          {isSyncing ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" /> Syncing…
                            </>
                          ) : (
                            'Sync Now'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Pair Code / QR */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              border: '1px dashed var(--color-border-default)',
              background: 'var(--color-bg-page)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex items-center gap-3">
              <QrCode size={24} style={{ color: 'var(--color-brand-600)' }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Direct Pair Code
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                  Enter this code on your peer device to connect
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--color-brand-700)',
                  background: 'var(--color-brand-50)',
                  padding: '4px 8px',
                  borderRadius: 6,
                }}
              >
                {pairCode}
              </span>
              <button
                className="btn btn-icon btn-ghost btn-xs"
                onClick={handleCopyCode}
                title="Copy pair code"
              >
                {copiedCode ? <Check size={14} color="#12B76A" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* E2E Security notice */}
          <div className="flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>
            <Shield size={13} style={{ flexShrink: 0, color: '#12B76A' }} />
            <span>End-to-end encrypted direct WebRTC channel. No data leaves your local network.</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--color-bg-subtle)',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
