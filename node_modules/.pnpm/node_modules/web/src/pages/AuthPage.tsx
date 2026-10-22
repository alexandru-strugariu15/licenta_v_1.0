import { useState } from 'react'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useNavigate } from 'react-router-dom'

export function AuthPage() {
  const { login } = useAppStore()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate auth
    await new Promise((r) => setTimeout(r, 800))

    const user = {
      id: 'user-1',
      name: name || 'Alexandru Strugariu',
      email: email || 'alex@example.com',
      initials: (name || 'Alexandru Strugariu')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
    }

    login(user)
    setLoading(false)
    navigate('/onboarding')
  }

  function handleDemoLogin() {
    login({
      id: 'user-demo',
      name: 'Alexandru Strugariu',
      email: 'alex@unstpb.ro',
      initials: 'AS',
    })
    useAppStore.getState().completeOnboarding({
      id: 'ws-demo',
      name: 'Licență UNSTPB',
      kind: 'university',
    })
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #6941C6 0%, #B692F6 100%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Second Brain
          </span>
        </div>

        <h1 className="auth-title" style={{ textAlign: 'center' }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="auth-subtitle" style={{ textAlign: 'center' }}>
          {mode === 'login'
            ? 'Sign in to your workspace'
            : 'Start building your second brain'}
        </p>

        {error && (
          <div className="badge badge-error" style={{ width: '100%', marginBottom: 16, padding: '8px 12px', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                type="text"
                className="form-input"
                placeholder="Alexandru Strugariu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="alex@unstpb.ro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)',
                  display: 'flex', alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Loading…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
        </div>

        {/* Demo login */}
        <button
          className="btn btn-secondary btn-lg"
          style={{ width: '100%' }}
          onClick={handleDemoLogin}
        >
          <Sparkles size={15} />
          Try demo workspace
        </button>

        {/* Toggle mode */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            style={{ color: 'var(--color-accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
