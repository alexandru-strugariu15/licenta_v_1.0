import { useState } from 'react'
import { Sparkles, ArrowRight, BookOpen, GraduationCap, Briefcase } from 'lucide-react'
import { useAppStore, type Workspace } from '../store/appStore'
import { useNavigate } from 'react-router-dom'

type WorkspaceKind = 'personal' | 'university' | 'project'

const WORKSPACE_OPTIONS: { kind: WorkspaceKind; icon: React.ReactNode; label: string; description: string }[] = [
  { kind: 'personal', icon: <BookOpen size={24} />, label: 'Personal', description: 'Journaling, ideas, and personal knowledge' },
  { kind: 'university', icon: <GraduationCap size={24} />, label: 'University', description: 'Lecture notes, assignments, and research' },
  { kind: 'project', icon: <Briefcase size={24} />, label: 'Project', description: 'Team notes, sprints, and documentation' },
]

const STEPS = ['Purpose', 'Workspace', 'Done']

export function OnboardingPage() {
  const { completeOnboarding } = useAppStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [selectedKind, setSelectedKind] = useState<WorkspaceKind>('university')
  const [workspaceName, setWorkspaceName] = useState('')

  function handleFinish() {
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name: workspaceName || (selectedKind === 'university' ? 'Licență UNSTPB' : selectedKind === 'project' ? 'My Project' : 'My Brain'),
      kind: selectedKind,
    }
    completeOnboarding(workspace)
    navigate('/')
  }

  return (
    <div className="auth-page" style={{ alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #6941C6 0%, #B692F6 100%)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Second Brain</span>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i <= step ? 'var(--color-accent)' : 'var(--color-bg-muted)',
                border: `2px solid ${i <= step ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
                color: i <= step ? 'white' : 'var(--color-text-tertiary)',
                transition: 'all 0.2s',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 13, color: i === step ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', fontWeight: i === step ? 500 : 400 }}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div style={{ width: 32, height: 1, background: i < step ? 'var(--color-accent)' : 'var(--color-border-subtle)', transition: 'background 0.2s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Choose purpose */}
        {step === 0 && (
          <div className="auth-card">
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
              What will you use it for?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              Choose the primary purpose of your workspace. You can create more later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {WORKSPACE_OPTIONS.map(({ kind, icon, label, description }) => (
                <button
                  key={kind}
                  onClick={() => setSelectedKind(kind)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 20px',
                    border: `2px solid ${selectedKind === kind ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                    borderRadius: 10,
                    background: selectedKind === kind ? 'var(--color-accent-light)' : 'white',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-family)',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: selectedKind === kind ? 'var(--color-accent)' : 'var(--color-bg-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selectedKind === kind ? 'white' : 'var(--color-text-secondary)',
                    flexShrink: 0, transition: 'all 0.15s',
                  }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>{description}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 24 }}
              onClick={() => setStep(1)}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1: Name workspace */}
        {step === 1 && (
          <div className="auth-card">
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
              Name your workspace
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              Give your {selectedKind} workspace a name.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="ws-name">Workspace name</label>
              <input
                id="ws-name"
                type="text"
                className="form-input"
                placeholder={selectedKind === 'university' ? 'Licență UNSTPB' : selectedKind === 'project' ? 'My Project' : 'My Second Brain'}
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(0)}>
                Back
              </button>
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={() => setStep(2)}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Done */}
        {step === 2 && (
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              You're all set!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Your workspace <strong>{workspaceName || 'Licență UNSTPB'}</strong> is ready.
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 32, lineHeight: 1.6 }}>
              Start taking notes with block-based editing, drawing with ink, and asking your AI co-pilot questions about your notes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, textAlign: 'left' }}>
              {[
                '✏️  Press / to insert blocks',
                '🖊️  Toggle a drawing canvas from any page',
                '✧  Ask your AI Co-pilot about your notes',
                '⌘K  Quick search across all pages',
              ].map((hint) => (
                <div key={hint} style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', gap: 8 }}>
                  {hint}
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleFinish}>
              <Sparkles size={16} />
              Open Second Brain
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
