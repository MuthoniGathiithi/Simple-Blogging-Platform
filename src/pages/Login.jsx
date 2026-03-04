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

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return setMsg({ type: 'error', text: error.message })
      navigate('/dashboard')
    } catch (err) {
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

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={{ margin: 0 }}>Log In</h2>
        <p style={{ color: '#5a5a75' }}>Access your dashboard</p>
        {msg && <div style={{ padding: 10, borderRadius: 8, background: msg.type === 'error' ? '#2a0b0f' : '#072216', color: msg.type === 'error' ? '#ffb6be' : '#9ff3c8' }}>{msg.text}</div>}
        <form onSubmit={handleLogin} style={s.form}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label style={s.label}>Password</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{...s.input, flex: 1}} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword(v => !v)} style={s.toggle}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</button>
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
}
