import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase_client'

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) return setMsg({ type: 'error', text: error.message })
      if (data.user && !data.session) {
        setMsg({ type: 'info', text: 'Check your email to confirm your account.' })
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setMsg({ type: 'error', text: (err && err.message) || 'Network error. Check console.' })
      console.error('Signup error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2 style={{ margin: 0 }}>Create Account</h2>
        <p style={{ color: '#5a5a75' }}>Sign up to manage your classes</p>
        {msg && <div style={{ padding: 10, borderRadius: 8, background: '#072216', color: '#9ff3c8' }}>{msg.text}</div>}
        <form onSubmit={handleSignup} style={s.form}>
          <label style={s.label}>Full name</label>
          <input style={s.input} value={name} onChange={e => setName(e.target.value)} required />
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label style={s.label}>Password</label>
          <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input style={{...s.input, flex: 1, paddingRight: 44}} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            <button type="button" onClick={() => setShowPassword(v => !v)} style={s.toggleAbsolute} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L21 21" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.58 10.58A3 3 0 0 0 13.42 13.42" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2.88 12.1C4.7 7.98 8.6 5 12 5c2.26 0 4.3 1 6.06 2.62M21.12 11.9C19.3 16.02 15.4 19 12 19c-2.26 0-4.3-1-6.06-2.62" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#e8e8f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </button>
          </div>
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <div style={{ marginTop: 12, fontSize: 13 }}>
          Already have an account? <span style={{ color: '#00e5a0', cursor: 'pointer' }} onClick={() => navigate('/login')}>Log in</span>
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
  btn: { marginTop: 6, padding: 10, borderRadius: 8, border: 'none', background: '#00e5a0', color: '#000', fontWeight: 700, cursor: 'pointer' }
  ,toggle: { padding: '8px 10px', borderRadius: 8, border: 'none', background: '#252535', color: '#e8e8f2', cursor: 'pointer' }
  ,toggleAbsolute: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 6, border: 'none', background: 'transparent', color: '#e8e8f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
}
