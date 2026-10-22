import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, Search, ZoomIn, ZoomOut, RotateCcw, BookOpen, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/appStore'

interface GraphNode {
  id: string
  pageId: string
  title: string
  notebook: string
  emoji: string
  x: number
  y: number
  radius: number
  color: string
  connections: string[]
  tags: string[]
}

const GRAPH_NODES: GraphNode[] = [
  {
    id: 'n-1',
    pageId: 'pg-1',
    title: 'Feedback Stability',
    notebook: 'Sisteme Automate',
    emoji: '📊',
    x: 400,
    y: 280,
    radius: 36,
    color: '#7F56D9',
    connections: ['n-2', 'n-3', 'n-4', 'n-5'],
    tags: ['Control', 'Stability', 'LTI'],
  },
  {
    id: 'n-2',
    pageId: 'pg-2',
    title: 'Bode Plots',
    notebook: 'Sisteme Automate',
    emoji: '📈',
    x: 230,
    y: 190,
    radius: 28,
    color: '#0BA5EC',
    connections: ['n-1', 'n-5'],
    tags: ['Frequency', 'Gain Margin'],
  },
  {
    id: 'n-3',
    pageId: 'pg-3',
    title: 'Root Locus',
    notebook: 'Sisteme Automate',
    emoji: '✏️',
    x: 580,
    y: 210,
    radius: 30,
    color: '#F79009',
    connections: ['n-1', 'n-4'],
    tags: ['Poles', 'Complex Plane'],
  },
  {
    id: 'n-4',
    pageId: 'pg-4',
    title: 'Lab 04 · PID Tuning',
    notebook: 'Sisteme Automate',
    emoji: '🤖',
    x: 520,
    y: 390,
    radius: 26,
    color: '#12B76A',
    connections: ['n-1', 'n-3'],
    tags: ['Laboratory', 'Simulink'],
  },
  {
    id: 'n-5',
    pageId: 'pg-nyquist',
    title: 'Nyquist Stability Criterion',
    notebook: 'Sisteme Automate',
    emoji: '🔄',
    x: 260,
    y: 370,
    radius: 28,
    color: '#6941C6',
    connections: ['n-1', 'n-2'],
    tags: ['Contour', 'Encirclements'],
  },
  {
    id: 'n-6',
    pageId: 'pg-4-pa',
    title: 'Design Patterns',
    notebook: 'Programare Avansată',
    emoji: '🏗️',
    x: 720,
    y: 330,
    radius: 28,
    color: '#EE46BC',
    connections: ['n-7'],
    tags: ['Architecture', 'OOP'],
  },
  {
    id: 'n-7',
    pageId: 'pg-5-pa',
    title: 'CRDT & Sync Architecture',
    notebook: 'Programare Avansată',
    emoji: '🔄',
    x: 670,
    y: 470,
    radius: 32,
    color: '#6172F3',
    connections: ['n-6', 'n-1'],
    tags: ['Yjs', 'P2P', 'Multiplayer'],
  },
]

export function KnowledgeGraphPage() {
  const navigate = useNavigate()
  const { setCurrentPage, setCurrentNotebook } = useAppStore()
  const [search, setSearch] = useState('')
  const [selectedNotebook, setSelectedNotebook] = useState<string>('all')
  const [selectedNodeId, setSelectedNodeId] = useState<string>('n-1')
  const [zoom, setZoom] = useState(1)

  const selectedNode = GRAPH_NODES.find((n) => n.id === selectedNodeId)

  const filteredNodes = useMemo(() => {
    return GRAPH_NODES.filter((node) => {
      const matchSearch =
        !search ||
        node.title.toLowerCase().includes(search.toLowerCase()) ||
        node.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchNotebook =
        selectedNotebook === 'all' || node.notebook === selectedNotebook
      return matchSearch && matchNotebook
    })
  }, [search, selectedNotebook])

  const edges = useMemo(() => {
    const list: { from: GraphNode; to: GraphNode }[] = []
    const seen = new Set<string>()

    GRAPH_NODES.forEach((node) => {
      node.connections.forEach((targetId) => {
        const target = GRAPH_NODES.find((n) => n.id === targetId)
        if (target) {
          const key = [node.id, target.id].sort().join('-')
          if (!seen.has(key)) {
            seen.add(key)
            list.push({ from: node, to: target })
          }
        }
      })
    })
    return list
  }, [])

  const handleOpenNote = (pageId: string) => {
    setCurrentPage(pageId)
    setCurrentNotebook('nb-1')
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-subtle)' }}>
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
            <GitBranch size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Knowledge Graph
              </h1>
              <span className="badge badge-brand" style={{ fontSize: 11 }}>
                {GRAPH_NODES.length} notes connected
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              Explore semantic connections, references, and prerequisites
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-border-default)',
              background: 'var(--color-bg-page)',
              width: 220,
            }}
          >
            <Search size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search concepts or tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 13,
                width: '100%',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Notebook filter */}
          <div className="flex items-center gap-1">
            {['all', 'Sisteme Automate', 'Programare Avansată'].map((nb) => (
              <button
                key={nb}
                className={`btn btn-xs ${selectedNotebook === nb ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedNotebook(nb)}
              >
                {nb === 'all' ? 'All' : nb}
              </button>
            ))}
          </div>

          {/* Zoom */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid var(--color-border-default)',
              borderRadius: 8,
              background: 'var(--color-bg-page)',
            }}
          >
            <button
              className="btn btn-icon btn-ghost btn-xs"
              onClick={() => setZoom((z) => Math.min(z + 0.15, 1.6))}
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              className="btn btn-icon btn-ghost btn-xs"
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              className="btn btn-icon btn-ghost btn-xs"
              onClick={() => setZoom(1)}
              title="Reset Zoom"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Graph Canvas and Side Inspector */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* SVG Graph View */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'grab' }}>
          <svg
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            viewBox="0 0 960 640"
          >
            {/* Grid Pattern */}
            <defs>
              <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="960" height="640" fill="url(#graph-grid)" />

            {/* Edges */}
            {edges.map(({ from, to }, idx) => {
              const isSelected = selectedNode && (from.id === selectedNode.id || to.id === selectedNode.id)
              return (
                <line
                  key={idx}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isSelected ? 'var(--color-brand-600)' : 'var(--color-border-strong)'}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  strokeDasharray={isSelected ? 'none' : '4,4'}
                  opacity={isSelected ? 0.9 : 0.4}
                />
              )
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {/* Selection glow */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius + 8}
                      fill="none"
                      stroke="var(--color-brand-500)"
                      strokeWidth="3"
                      opacity="0.35"
                    />
                  )}

                  {/* Main circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={isSelected ? node.color : 'var(--color-bg-page)'}
                    stroke={node.color}
                    strokeWidth={isSelected ? 3 : 2}
                    filter="drop-shadow(0 2px 6px rgba(0,0,0,0.08))"
                  />

                  {/* Emoji / Icon */}
                  <text
                    x={node.x}
                    y={node.y + 6}
                    textAnchor="middle"
                    fontSize={node.radius > 30 ? 20 : 16}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.emoji}
                  </text>

                  {/* Node label */}
                  <text
                    x={node.x}
                    y={node.y + node.radius + 16}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight={isSelected ? '600' : '500'}
                    fill="var(--color-text-primary)"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.title}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <aside
            style={{
              width: 340,
              background: 'var(--color-bg-page)',
              borderLeft: '1px solid var(--color-border-default)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 28 }}>{selectedNode.emoji}</span>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {selectedNode.title}
                  </h2>
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    📁 {selectedNode.notebook}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Tags */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Tags & Concepts
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedNode.tags.map((tag) => (
                    <span key={tag} className="badge badge-secondary" style={{ fontSize: 11 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connected notes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Linked Notes ({selectedNode.connections.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedNode.connections.map((connId) => {
                    const conn = GRAPH_NODES.find((n) => n.id === connId)
                    if (!conn) return null
                    return (
                      <div
                        key={conn.id}
                        onClick={() => setSelectedNodeId(conn.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: 'var(--color-bg-subtle)',
                          border: '1px solid var(--color-border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span>{conn.emoji}</span>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {conn.title}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                          {conn.notebook}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Graph Insight */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'var(--color-brand-50)',
                  border: '1px solid var(--color-brand-100)',
                }}
              >
                <div className="flex items-center gap-2" style={{ color: 'var(--color-brand-700)', marginBottom: 6 }}>
                  <Sparkles size={14} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>AI Knowledge Synthesis</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-brand-900)', lineHeight: 1.5 }}>
                  This note serves as a bridge between continuous-time control theory and discrete simulation models.
                </p>
              </div>

              {/* Open Note Button */}
              <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleOpenNote(selectedNode.pageId)}
                >
                  <BookOpen size={14} /> Open Note
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
