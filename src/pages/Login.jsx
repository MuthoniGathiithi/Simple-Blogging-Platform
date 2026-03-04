import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase_client'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const lower = (error.message || '').toLowerCase()
        const notFound = lower.includes('invalid') && lower.includes('credentials') || lower.includes('user not found') || lower.includes('no user') || lower.includes('not found')
        if (notFound) setShowSignupPrompt(true)
        setMsg({ type: 'error', text: error.message })
        return
      }
      setShowSignupPrompt(false)
      navigate('/dashboard')
    } catch (err) {
      setShowSignupPrompt(false)
      setMsg({ type: 'error', text: (err && err.message) || 'Network error. Check console.' })
      console.error('Login error', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })
    if (error) setMsg({ type: 'error', text: error.message })
  }

  const handleReset = async (e) => {
    e?.preventDefault()
    setResetLoading(true); setMsg(null)
    try {
      const targetEmail = resetEmail || email
      if (!targetEmail) return setMsg({ type: 'error', text: 'Please provide your email address.' })
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo: `${window.location.origin}/update-password` })
      if (error) return setMsg({ type: 'error', text: error.message })
      setMsg({ type: 'info', text: 'Password reset email sent. Check your inbox.' })
      setShowReset(false)
    } catch (err) {
      setMsg({ type: 'error', text: (err && err.message) || 'Network error. Check console.' })
      console.error('Reset password error', err)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={{ margin: 0 }}>Log In</h2>
        <p style={{ color: '#5a5a75' }}>Access your dashboard</p>
        {msg && <div style={{ padding: 10, borderRadius: 8, background: msg.type === 'error' ? '#2a0b0f' : '#072216', color: msg.type === 'error' ? '#ffb6be' : '#9ff3c8' }}>{msg.text}</div>}
        {showSignupPrompt && <div style={{ marginTop: 8, fontSize: 13 }}>No account found for this email. <span style={{ color: '#00e5a0', cursor: 'pointer' }} onClick={() => navigate('/signup')}>Sign up</span></div>}
        <form onSubmit={handleLogin} style={s.form}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label style={s.label}>Password</label>
          <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input style={{...s.input, flex: 1, paddingRight: 44}} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword(v => !v)} style={s.toggleAbsolute} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L21 21" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.58 10.58A3 3 0 0 0 13.42 13.42" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.88 12.1C4.7 7.98 8.6 5 12 5c2.26 0 4.3 1 6.06 2.62M21.12 11.9C19.3 16.02 15.4 19 12 19c-2.26 0-4.3-1-6.06-2.62" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</button>
            <div>
              {!showReset ? (
                <button type="button" onClick={() => setShowReset(true)} style={s.resetLink}>Forgot password?</button>
              ) : (
                <form onSubmit={handleReset} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input placeholder="Email for reset" style={{...s.input, padding: 8}} value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                  <button type="submit" style={s.resetBtn} disabled={resetLoading}>{resetLoading ? 'Sending...' : 'Send'}</button>
                  <button type="button" onClick={() => setShowReset(false)} style={s.resetCancel}>Cancel</button>
                </form>
              )}
            </div>
          </div>
        </form>
        <div style={{ marginTop: 8 }}>
          <button style={s.google} onClick={handleGoogle}>Continue with Google</button>
        </div>
        <div style={{ marginTop: 12, fontSize: 13 }}>
          Don't have an account? <span style={{ color: '#00e5a0', cursor: 'pointer' }} onClick={() => navigate('/signup')}>Sign up</span>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', padding: 24 },
  card: { width: 420, padding: 28, borderRadius: 12, background: '#11111a', border: '1px solid #1a1a28', color: '#e8e8f2' },
  form: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 },
  label: { fontSize: 12, color: '#5a5a75' },
  input: { padding: 10, borderRadius: 8, border: '1px solid #252535', background: '#0f0f16', color: '#e8e8f2' },
  btn: { marginTop: 6, padding: 10, borderRadius: 8, border: 'none', background: '#00e5a0', color: '#000', fontWeight: 700, cursor: 'pointer' },
  google: { marginTop: 6, padding: 10, borderRadius: 8, border: '1px solid #252535', background: 'transparent', color: '#e8e8f2', cursor: 'pointer' }
  ,toggle: { padding: '8px 10px', borderRadius: 8, border: 'none', background: '#252535', color: '#e8e8f2', cursor: 'pointer' }
  ,toggleAbsolute: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 6, border: 'none', background: 'transparent', color: '#e8e8f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  ,resetLink: { background: 'transparent', border: 'none', color: '#9ff3c8', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 },resetBtn: { padding: '8px 10px', borderRadius: 8, border: 'none', background: '#00e5a0', color: '#000', fontWeight: 700, cursor: 'pointer' },resetCancel: { padding: '8px 10px', borderRadius: 8, border: 'none', background: '#555', color: '#e8e8f2', cursor: 'pointer' }
}
