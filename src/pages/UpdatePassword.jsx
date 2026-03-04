import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase_client'

export default function UpdatePassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sends tokens in the URL fragment (hash) like #access_token=...&refresh_token=...
    const searchParams = new URLSearchParams(window.location.search)
    const hash = window.location.hash ? window.location.hash.replace(/^#/, '') : ''
    const hashParams = new URLSearchParams(hash)
    const access_token = hashParams.get('access_token') || searchParams.get('access_token') || hashParams.get('access-token') || searchParams.get('access-token')
    const refresh_token = hashParams.get('refresh_token') || searchParams.get('refresh_token') || hashParams.get('refresh-token') || searchParams.get('refresh-token')

    if (!access_token) {
      setMsg({ type: 'error', text: 'No reset token found in the URL. Please use the link from your email.' })
      return
    }

    // Try to set the session so updateUser can be called
    ;(async () => {
      try {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) {
          setMsg({ type: 'error', text: error.message || 'Failed to set session from token.' })
          console.error('setSession error', error)
          return
        }
        setReady(true)
        // Clean the URL so tokens aren't visible in the address bar
        history.replaceState(null, '', window.location.pathname)
      } catch (err) {
        setMsg({ type: 'error', text: (err && err.message) || 'Network error while restoring session.' })
        console.error('session restore', err)
      }
    })()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) return setMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
    if (newPassword !== confirm) return setMsg({ type: 'error', text: "Passwords don't match." })
    setLoading(true); setMsg(null)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) return setMsg({ type: 'error', text: error.message })
      setMsg({ type: 'info', text: 'Password updated. You can now log in.' })
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setMsg({ type: 'error', text: (err && err.message) || 'Network error. Try again.' })
      console.error('updateUser error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', padding: 24 }}>
      <div style={{ width: 420, padding: 28, borderRadius: 12, background: '#11111a', border: '1px solid #1a1a28', color: '#e8e8f2' }}>
        <h2 style={{ margin: 0 }}>Set a new password</h2>
        <p style={{ color: '#5a5a75' }}>Enter a new password to complete the reset.</p>
        {msg && <div style={{ padding: 10, borderRadius: 8, background: msg.type === 'error' ? '#2a0b0f' : '#072216', color: msg.type === 'error' ? '#ffb6be' : '#9ff3c8' }}>{msg.text}</div>}
        {!ready ? (
          <div style={{ marginTop: 12 }}>Preparing secure session...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <label style={{ fontSize: 12, color: '#5a5a75' }}>New password</label>
            <input style={{ padding: 10, borderRadius: 8, border: '1px solid #252535', background: '#0f0f16', color: '#e8e8f2' }} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
            <label style={{ fontSize: 12, color: '#5a5a75' }}>Confirm password</label>
            <input style={{ padding: 10, borderRadius: 8, border: '1px solid #252535', background: '#0f0f16', color: '#e8e8f2' }} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
            <button style={{ marginTop: 6, padding: 10, borderRadius: 8, border: 'none', background: '#00e5a0', color: '#000', fontWeight: 700, cursor: 'pointer' }} type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
