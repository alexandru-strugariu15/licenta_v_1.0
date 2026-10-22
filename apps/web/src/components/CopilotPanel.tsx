import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, ChevronRight, Loader, Pencil, FileText, Check } from 'lucide-react'
import { useAppStore } from '../store/appStore'

type CopilotTab = 'ask' | 'drawing' | 'tasks' | 'summary'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  citations?: { index: number; title: string; quote: string }[]
}

const DEMO_MESSAGES: Message[] = [
  {
    id: '1', role: 'user',
    content: 'Explain feedback stability from my notes',
  },
  {
    id: '2', role: 'ai',
    content: 'Based on your notes on **Feedback Stability** [1], a closed-loop system is stable when all poles of the transfer function lie in the left half of the complex s-plane.\n\nThe key criterion comes from your Bode Plots notes [2]: gain margin and phase margin must both be positive for stability.',
    citations: [
      { index: 1, title: 'Feedback Stability', quote: 'all poles must lie in the left half of the complex s-plane' },
      { index: 2, title: 'Bode Plots', quote: 'gain margin and phase margin must both be positive' },
    ],
  },
]

export function CopilotPanel() {
  const { toggleCopilot } = useAppStore()
  const [activeTab, setActiveTab] = useState<CopilotTab>('ask')
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [segmentedMode, setSegmentedMode] = useState<'insert' | 'replace'>('insert')
  const [recognitionLoading, setRecognitionLoading] = useState(false)
  const [recognizedResult, setRecognizedResult] = useState<string | null>(null)
  const [tasksDone, setTasksDone] = useState<Record<string, boolean>>({
    't1': true,
    't2': false,
    't3': false,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1200))

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: 'ai',
      content: 'Based on your notes, this topic is covered in the context of control systems theory. The relationship between input and output stability is defined by the system\'s transfer function poles [1].\n\nI found 3 relevant sections in your notes that discuss this.',
      citations: [
        { index: 1, title: 'Feedback Stability', quote: 'poles of the closed-loop transfer function' },
      ],
    }
    setMessages((m) => [...m, aiMsg])
    setIsLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  function renderMessage(msg: Message) {
    if (msg.role === 'user') {
      return (
        <div key={msg.id} className="copilot-message user">
          {msg.content}
        </div>
      )
    }

    // Parse bold markdown
    const parts = msg.content.split(/(\*\*[^*]+\*\*|\[\d+\])/g)
    const rendered = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      const citMatch = part.match(/^\[(\d+)\]$/)
      if (citMatch) {
        const idx = parseInt(citMatch[1])
        const cit = msg.citations?.find((c) => c.index === idx)
        return (
          <button
            key={i}
            className="copilot-citation"
            onClick={() => {}}
            title={cit?.quote}
          >
            {part}
          </button>
        )
      }
      return <span key={i}>{part}</span>
    })

    return (
      <div key={msg.id} className="copilot-message ai">
        <p style={{ lineHeight: 1.6, margin: 0, marginBottom: 8 }}>{rendered}</p>
        {msg.citations && msg.citations.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
              Sources
            </div>
            {msg.citations.map((cit) => (
              <button
                key={cit.index}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  width: '100%', padding: '6px 8px', marginBottom: 4,
                  background: 'var(--color-bg-muted)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.12s',
                  fontFamily: 'var(--font-family)',
                }}
                onClick={() => {}}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent)', flexShrink: 0 }}>
                  [{cit.index}]
                </span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cit.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{cit.quote}"
                  </div>
                </div>
                <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="copilot-panel">
      {/* Header */}
      <div className="copilot-header">
        <div className="copilot-header-title">
          <Sparkles size={15} className="copilot-sparkle" />
          AI Co-pilot
        </div>
        <button
          className="btn btn-icon btn-ghost"
          onClick={toggleCopilot}
          aria-label="Close co-pilot"
          style={{ width: 28, height: 28 }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className="copilot-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '0 8px' }}>
        {(['ask', 'drawing', 'tasks', 'summary'] as CopilotTab[]).map((tab) => (
          <button
            key={tab}
            className={`copilot-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{ padding: '8px 4px', fontSize: 12, textAlign: 'center' }}
          >
            {tab === 'ask' ? 'Ask' : tab === 'drawing' ? 'Drawing' : tab === 'tasks' ? 'Tasks' : 'Summary'}
          </button>
        ))}
      </div>

      {/* Body */}
      {activeTab === 'ask' ? (
        <>
          <div className="copilot-body">
            {messages.length === 0 ? (
              <div className="copilot-empty-state">
                <div className="copilot-empty-icon">✧</div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    Ask about your notes
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    I'll answer only from what's in your notebooks, with citations.
                  </p>
                </div>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            {isLoading && (
              <div className="copilot-message ai" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader size={14} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Searching your notes…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="copilot-input-area">
            <div className="copilot-input-wrapper">
              <textarea
                ref={textareaRef}
                className="copilot-input"
                placeholder="Ask your notes anything…"
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                rows={1}
                style={{ resize: 'none' }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                style={{ flexShrink: 0 }}
              >
                <Send size={13} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
              Answers cite only your notes · Requires internet
            </p>
          </div>
        </>
      ) : activeTab === 'drawing' ? (
        <div className="copilot-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Target header */}
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <Pencil size={13} style={{ color: 'var(--color-brand-600)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Target Canvas
              </span>
              <span className="badge badge-brand" style={{ marginLeft: 'auto', fontSize: 10 }}>
                Active Block
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: 0 }}>
              Root locus sketch in "Feedback Stability"
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              onClick={() => {
                setRecognitionLoading(true)
                setTimeout(() => {
                  setRecognizedResult('1 + G(s)H(s) = 0\nClosed-loop characteristic equation: s² + 2ζωₙs + ωₙ² = 0')
                  setRecognitionLoading(false)
                }, 1000)
              }}
            >
              <FileText size={15} style={{ color: 'var(--color-brand-600)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Convert handwriting to text</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Transcribe formulas &amp; annotations</div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              onClick={() => {
                setRecognitionLoading(true)
                setTimeout(() => {
                  setRecognizedResult('Root Locus plot: 2 open-loop poles at s = -1 ± 2j and 1 zero at s = -3. Trajectory crosses imaginary axis at K_crit = 4.2.')
                  setRecognitionLoading(false)
                }, 1000)
              }}
            >
              <Sparkles size={15} style={{ color: 'var(--color-brand-600)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Describe this sketch</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Generate technical explanation</div>
              </div>
            </button>
          </div>

          {/* Loading state */}
          {recognitionLoading && (
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: 'var(--color-brand-50)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Loader size={16} className="animate-spin" style={{ color: 'var(--color-brand-600)' }} />
              <span style={{ fontSize: 13, color: 'var(--color-brand-800)' }}>
                Analyzing sketch with vision model…
              </span>
            </div>
          )}

          {/* Recognition result card */}
          {recognizedResult && (
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-bg-page)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Recognized Content
                </span>
                <span className="badge badge-success" style={{ fontSize: 10 }}>
                  Confidence: 96%
                </span>
              </div>

              <pre
                style={{
                  background: 'var(--color-bg-subtle)',
                  padding: 10,
                  borderRadius: 6,
                  fontSize: 12,
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {recognizedResult}
              </pre>

              {/* Segmented Control: Insert vs Replace */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--color-bg-subtle)',
                  borderRadius: 8,
                  padding: 3,
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <button
                  style={{
                    flex: 1,
                    border: 'none',
                    background: segmentedMode === 'insert' ? 'var(--color-bg-page)' : 'transparent',
                    boxShadow: segmentedMode === 'insert' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    borderRadius: 6,
                    padding: '6px 0',
                    fontSize: 12,
                    fontWeight: 600,
                    color: segmentedMode === 'insert' ? 'var(--color-brand-700)' : 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSegmentedMode('insert')}
                >
                  Insert as text
                </button>
                <button
                  style={{
                    flex: 1,
                    border: 'none',
                    background: segmentedMode === 'replace' ? 'var(--color-bg-page)' : 'transparent',
                    boxShadow: segmentedMode === 'replace' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    borderRadius: 6,
                    padding: '6px 0',
                    fontSize: 12,
                    fontWeight: 600,
                    color: segmentedMode === 'replace' ? 'var(--color-brand-700)' : 'var(--color-text-tertiary)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSegmentedMode('replace')}
                >
                  Replace strokes
                </button>
              </div>

              {/* Apply button */}
              <button
                className="btn btn-primary btn-sm"
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  alert('Content successfully inserted into note!')
                  setRecognizedResult(null)
                }}
              >
                <Check size={13} />
                {segmentedMode === 'insert' ? 'Insert reviewed text into page' : 'Replace selected strokes'}
              </button>
            </div>
          )}
        </div>
      ) : activeTab === 'tasks' ? (
        <div className="copilot-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="flex items-center justify-between" style={{ padding: '0 4px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Action Items in this Note
            </span>
            <span className="badge badge-brand" style={{ fontSize: 10 }}>
              3 detected
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 't1', text: 'Review Routh-Hurwitz conditions and polynomial coefficients' },
              { id: 't2', text: 'Simulate closed-loop root locus in MATLAB' },
              { id: 't3', text: 'Write up analytical stability analysis section' },
            ].map((task) => {
              const done = tasksDone[task.id]
              return (
                <div
                  key={task.id}
                  onClick={() => setTasksDone((prev) => ({ ...prev, [task.id]: !prev[task.id] }))}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: done ? 'var(--color-bg-subtle)' : 'var(--color-bg-page)',
                    border: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      border: done ? 'none' : '2px solid var(--color-border-strong)',
                      background: done ? 'var(--color-brand-600)' : 'transparent',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  >
                    {done && <Check size={11} strokeWidth={3} />}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: done ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                      textDecoration: done ? 'line-through' : 'none',
                      lineHeight: 1.4,
                    }}
                  >
                    {task.text}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="copilot-body">
          <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              Page Executive Summary
            </p>
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                background: 'var(--color-bg-subtle)',
                padding: 14,
                borderRadius: 10,
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              This note covers <strong>Feedback Stability</strong> in continuous-time control systems. Key takeaways:
              <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                <li>All closed-loop poles must reside strictly in the Left Half-Plane (LHP).</li>
                <li>Negative feedback alone does not assure stability without sufficient gain and phase margins.</li>
                <li>Root locus trajectories trace pole migration under varying loop gain K.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
