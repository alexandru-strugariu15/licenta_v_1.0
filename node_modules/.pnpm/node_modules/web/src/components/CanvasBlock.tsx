import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MousePointer2, PenLine, Highlighter, Eraser,
  Lasso, Shapes, Type, Undo2, Redo2, GripVertical
} from 'lucide-react'
import { getStroke } from 'perfect-freehand'

type Tool = 'select' | 'pen' | 'highlighter' | 'eraser' | 'lasso' | 'shapes' | 'text'

interface Stroke {
  id: string
  tool: 'pen' | 'highlighter'
  color: string
  width: number
  opacity: number
  points: [number, number, number][]
}

const INK_COLORS = [
  '#1a1a1a', '#6941C6', '#175CD3', '#067647', '#B54708', '#B42318',
  '#1D2939', '#7F56D9', '#2E90FA', '#12B76A', '#F79009', '#F04438',
]

export function CanvasBlock() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeTool, setActiveTool] = useState<Tool>('pen')
  const [activeColor, setActiveColor] = useState('#1a1a1a')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [liveStroke, setLiveStroke] = useState<[number, number, number][]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [history, setHistory] = useState<Stroke[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  const WIDTH = 800
  const HEIGHT = 440

  const [showAxes, setShowAxes] = useState(true)

  // Keyboard shortcuts: P, H, E, L
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const k = e.key.toLowerCase()
      if (k === 'p') setActiveTool('pen')
      else if (k === 'h') setActiveTool('highlighter')
      else if (k === 'e') setActiveTool('eraser')
      else if (k === 'l') setActiveTool('lasso')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Render all strokes and coordinate plane to canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, WIDTH, HEIGHT)

    // Draw grid
    ctx.strokeStyle = 'rgba(0,0,0,0.04)'
    ctx.lineWidth = 1
    for (let x = 0; x < WIDTH; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke()
    }
    for (let y = 0; y < HEIGHT; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke()
    }

    // Draw s-plane axes and stable region if enabled
    if (showAxes) {
      const originX = WIDTH / 2 + 60
      const originY = HEIGHT / 2

      // LHP Stable region tint
      ctx.fillStyle = 'rgba(18, 183, 106, 0.04)'
      ctx.fillRect(0, 0, originX, HEIGHT)

      // Stable region label
      ctx.fillStyle = 'rgba(18, 183, 106, 0.7)'
      ctx.font = '500 11px Inter, sans-serif'
      ctx.fillText('Stable Region: Re(s) < 0', 24, 28)

      // Axes lines
      ctx.strokeStyle = 'rgba(102, 112, 133, 0.4)'
      ctx.lineWidth = 1.5

      // Real axis
      ctx.beginPath()
      ctx.moveTo(30, originY)
      ctx.lineTo(WIDTH - 30, originY)
      ctx.stroke()

      // Imaginary axis
      ctx.beginPath()
      ctx.moveTo(originX, 20)
      ctx.lineTo(originX, HEIGHT - 20)
      ctx.stroke()

      // Axis labels
      ctx.fillStyle = 'var(--color-text-secondary)'
      ctx.font = '600 12px Inter, sans-serif'
      ctx.fillText('σ (Real)', WIDTH - 75, originY - 8)
      ctx.fillText('jω (Imaginary)', originX + 8, 30)

      // Stable poles markers (X)
      const poles = [
        { x: originX - 120, y: originY - 70 },
        { x: originX - 120, y: originY + 70 },
        { x: originX - 220, y: originY },
      ]
      ctx.strokeStyle = '#B42318'
      ctx.lineWidth = 2
      poles.forEach((p) => {
        ctx.beginPath()
        ctx.moveTo(p.x - 6, p.y - 6); ctx.lineTo(p.x + 6, p.y + 6)
        ctx.moveTo(p.x + 6, p.y - 6); ctx.lineTo(p.x - 6, p.y + 6)
        ctx.stroke()
      })
    }

    // Draw committed strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.width, stroke.opacity, stroke.tool === 'highlighter')
    })

    // Draw live stroke
    if (liveStroke.length > 1) {
      drawStroke(ctx, liveStroke, activeColor, strokeWidth, activeTool === 'highlighter' ? 0.35 : 1, activeTool === 'highlighter')
    }
  }, [strokes, liveStroke, activeColor, strokeWidth, activeTool, showAxes])

  useEffect(() => { render() }, [render])

  function drawStroke(
    ctx: CanvasRenderingContext2D,
    points: [number, number, number][],
    color: string,
    width: number,
    opacity: number,
    isHighlighter: boolean
  ) {
    if (points.length < 2) return

    const outlinePoints = getStroke(points, {
      size: isHighlighter ? width * 4 : width * 2,
      thinning: isHighlighter ? 0 : 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true,
    })

    if (outlinePoints.length < 2) return

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.fillStyle = color

    const path = new Path2D()
    path.moveTo(outlinePoints[0][0], outlinePoints[0][1])
    for (let i = 1; i < outlinePoints.length; i++) {
      path.lineTo(outlinePoints[i][0], outlinePoints[i][1])
    }
    path.closePath()
    ctx.fill(path)
    ctx.restore()
  }

  function getCanvasPoint(e: React.PointerEvent): [number, number, number] {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = WIDTH / rect.width
    const scaleY = HEIGHT / rect.height
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
      e.pressure || 0.5,
    ]
  }

  function onPointerDown(e: React.PointerEvent) {
    if (activeTool === 'select') return
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    setLiveStroke([getCanvasPoint(e)])
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDrawing) return
    setLiveStroke((pts) => [...pts, getCanvasPoint(e)])
  }

  function onPointerUp() {
    if (!isDrawing || activeTool === 'select') return
    setIsDrawing(false)

    if (liveStroke.length > 1 && activeTool !== 'eraser') {
      const newStroke: Stroke = {
        id: crypto.randomUUID(),
        tool: activeTool === 'highlighter' ? 'highlighter' : 'pen',
        color: activeColor,
        width: strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.35 : 1,
        points: liveStroke,
      }
      const newStrokes = [...strokes, newStroke]
      setStrokes(newStrokes)

      // Update history
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newStrokes)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }

    if (activeTool === 'eraser' && liveStroke.length > 0) {
      // Erase strokes that are near the eraser path
      const [ex, ey] = liveStroke[liveStroke.length - 1]
      setStrokes((prev) => prev.filter((stroke) => {
        return !stroke.points.some(([x, y]) => Math.hypot(x - ex, y - ey) < 20)
      }))
    }

    setLiveStroke([])
  }

  const undo = () => {
    if (historyIndex <= 0) return
    const idx = historyIndex - 1
    setHistoryIndex(idx)
    setStrokes(history[idx])
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return
    const idx = historyIndex + 1
    setHistoryIndex(idx)
    setStrokes(history[idx])
  }

  const tools: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: 'select', icon: <MousePointer2 size={15} />, label: 'Select', shortcut: 'S' },
    { id: 'pen', icon: <PenLine size={15} />, label: 'Pen', shortcut: 'P' },
    { id: 'highlighter', icon: <Highlighter size={15} />, label: 'Highlighter', shortcut: 'H' },
    { id: 'eraser', icon: <Eraser size={15} />, label: 'Eraser', shortcut: 'E' },
    { id: 'lasso', icon: <Lasso size={15} />, label: 'Lasso', shortcut: 'L' },
    { id: 'shapes', icon: <Shapes size={15} />, label: 'Shapes', shortcut: '' },
    { id: 'text', icon: <Type size={15} />, label: 'Text', shortcut: 'T' },
  ]

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const map: Record<string, Tool> = { p: 'pen', h: 'highlighter', e: 'eraser', l: 'lasso', s: 'select', t: 'text' }
      if (map[e.key.toLowerCase()]) setActiveTool(map[e.key.toLowerCase()])
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.shiftKey ? redo() : undo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  return (
    <div className="canvas-block">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{
          width: '100%',
          height: 'auto',
          cursor: activeTool === 'select' ? 'default'
            : activeTool === 'eraser' ? 'cell'
            : 'crosshair',
          display: 'block',
          maxHeight: 440,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      {/* Drawing Palette (bottom) */}
      <div
        className="canvas-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'var(--color-bg-page)',
          borderTop: '1px solid var(--color-border-subtle)',
          borderRadius: '0 0 12px 12px',
        }}
      >
        {/* Left tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <GripVertical size={14} style={{ color: 'var(--color-text-disabled)', cursor: 'grab', marginRight: 2 }} />
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`canvas-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
              data-tooltip={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
              aria-label={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Center colors & width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {INK_COLORS.slice(0, 6).map((color) => (
            <button
              key={color}
              className={`ink-swatch ${activeColor === color ? 'selected' : ''}`}
              style={{ background: color }}
              onClick={() => setActiveColor(color)}
              aria-label={`Color ${color}`}
            />
          ))}

          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            style={{
              border: '1px solid var(--color-border-default)',
              borderRadius: 6,
              padding: '2px 4px',
              fontSize: 11,
              background: 'var(--color-bg-page)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              outline: 'none',
              marginLeft: 4,
            }}
            aria-label="Stroke width"
          >
            <option value={2}>2 px</option>
            <option value={4}>4 px</option>
            <option value={6}>6 px</option>
            <option value={10}>10 px</option>
          </select>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            className="canvas-tool-btn"
            onClick={undo}
            disabled={historyIndex <= 0}
            data-tooltip="Undo (⌘Z)"
            aria-label="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            className="canvas-tool-btn"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            data-tooltip="Redo (⌘⇧Z)"
            aria-label="Redo"
          >
            <Redo2 size={14} />
          </button>

          <div style={{ width: 1, height: 18, background: 'var(--color-border-subtle)', margin: '0 4px' }} />

          <button
            className={`btn btn-xs ${showAxes ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowAxes(!showAxes)}
            data-tooltip="Toggle s-plane coordinate axes"
            style={{ fontSize: 11, padding: '3px 7px' }}
          >
            s-plane
          </button>

          <button
            className="btn btn-xs btn-secondary"
            onClick={() => {
              const originX = WIDTH / 2 + 60
              const originY = HEIGHT / 2
              const branch1: Stroke = {
                id: `rl-1-${Date.now()}`,
                tool: 'pen',
                color: '#7F56D9',
                width: 3,
                opacity: 0.9,
                points: [
                  [originX - 120, originY - 70, 0.6],
                  [originX - 90, originY - 40, 0.7],
                  [originX - 50, originY, 0.8],
                  [originX, originY - 80, 0.7],
                  [originX + 30, originY - 140, 0.6],
                ],
              }
              const branch2: Stroke = {
                id: `rl-2-${Date.now()}`,
                tool: 'pen',
                color: '#7F56D9',
                width: 3,
                opacity: 0.9,
                points: [
                  [originX - 120, originY + 70, 0.6],
                  [originX - 90, originY + 40, 0.7],
                  [originX - 50, originY, 0.8],
                  [originX, originY + 80, 0.7],
                  [originX + 30, originY + 140, 0.6],
                ],
              }
              setStrokes((prev) => [...prev, branch1, branch2])
            }}
            data-tooltip="Plot Root Locus trajectories"
            style={{ fontSize: 11, padding: '3px 7px' }}
          >
            Plot Locus
          </button>

          <button
            className="btn btn-xs btn-ghost"
            onClick={() => setStrokes([])}
            style={{ fontSize: 11, color: 'var(--color-text-tertiary)', padding: '3px 6px' }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
