import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase_client'

// ── tiny toast hook ───────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null)
  const show = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }
  return { toast, show }
}

export default function Landing() {
  const navigate = useNavigate()
  const { toast, show: showToast } = useToast()

  const [tab, setTab]           = useState('login')   // 'login' | 'signup'
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState(null)      // { text, type }

  // form fields
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // If already logged in → go straight to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard')
    })
  }, [navigate])

  const switchTab = (t) => {
    setTab(t)
    setMessage(null)
    setName(''); setEmail(''); setPassword('')
  }

  // ── LOGIN ───────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setMessage(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setMessage({ text: error.message, type: 'error' }); return }
    showToast(`Welcome back! 👋`)
    setTimeout(() => navigate('/dashboard'), 900)
  }

  // ── SIGNUP ──────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true); setMessage(null)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    setLoading(false)
    if (error) { setMessage({ text: error.message, type: 'error' }); return }
    if (data.user && !data.session) {
      setMessage({ text: '✓ Check your email to confirm your account!', type: 'success' })
    } else {
      showToast('Account created! Welcome 🎉')
      setTimeout(() => navigate('/dashboard'), 900)
    }
  }

  // ── GOOGLE ──────────────────────────────────────────────────────
  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) showToast(error.message, 'error')
  }

  return (
    <div style={s.root}>
      {/* Background */}
      <div style={s.bgGrid} />
      <div style={{ ...s.bgGlow, top: -200, left: -200, background: '#00e5a0' }} />
      <div style={{ ...s.bgGlow, bottom: -100, right: -100, background: '#7c5cfc', width: 500, height: 500 }} />

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.logo}>
          <div style={s.logoMark}>👁</div>
          Face<span style={{ color: '#00e5a0' }}>Attend</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.navGhost} onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
            Features
          </button>
          <button style={s.navOutline} onClick={() => switchTab('login')}>Log In</button>
          <button style={s.navSolid}   onClick={() => switchTab('signup')}>Get Started</button>
        </div>
        <div style={s.sessionBadge}>
          <div style={s.liveDot} />
          CS101 · Session Active
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>

        {/* Left copy */}
        <div style={s.heroLeft}>
          <div style={s.eyebrow}>
            <div style={s.eyebrowDot} />
            AI-Powered Attendance
          </div>

          <h1 style={s.heroTitle}>
            <span style={{ color: '#5a5a75' }}>Attendance,</span>
            <br />
            <span style={{ color: '#00e5a0' }}>Redefined.</span>
          </h1>

          <p style={s.heroDesc}>
            Replace manual roll calls with real-time facial recognition.
            Register students once — the system handles everything else,
            instantly marking who's present and who isn't.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button style={s.ctaPrimary} onClick={() => switchTab('signup')}>
              ✦ Start Free →
            </button>
            <button style={s.ctaSecondary} onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              See How It Works
            </button>
          </div>

          <div style={s.statsRow}>
            {[
              { num: '99.3%', label: 'ACCURACY' },
              { num: '<1s',   label: 'RECOGNITION' },
              { num: '∞',     label: 'STUDENTS' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#00e5a0', lineHeight: 1 }}>{num}</div>
                <div style={s.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — auth actions (moved to separate pages) */}
        <div style={s.heroRight}>
          <div style={s.authCard}>
            <div style={{ padding: 20 }}>
              <h3 style={{ margin: '6px 0 4px' }}>Get Started</h3>
              <div style={{ color: '#5a5a75', marginBottom: 12 }}>Create an account or sign in to manage your classes</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={s.authBtn} onClick={() => navigate('/signup')}>✦ Get Started</button>
                <button style={s.navOutline} onClick={() => navigate('/login')}>Log In</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={s.features}>
        <div style={s.featuresGrid}>
          {[
            { icon: '👁', title: 'Real-Time Recognition', desc: 'Identifies registered students in under a second using a 128-dimensional ResNet face embedding model. No extra hardware — just a webcam.' },
            { icon: '📋', title: 'Instant Reports',       desc: 'See who\'s present and absent live. Export full session reports to CSV with one click. Timestamps, confidence scores, attendance rate — all included.' },
            { icon: '🔒', title: 'Secure & Private',      desc: 'Face embeddings are stored as encrypted vectors, not images. Built on Supabase with Row Level Security — each institution\'s data is fully isolated.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={s.featureCard}>
              <div style={s.featureIcon}>{icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#5a5a75', lineHeight: 1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <span style={{ color: '#5a5a75', fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
          © 2026 FaceAttend. All rights reserved.
        </span>
        <span style={{ color: '#00e5a0', fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
          Built with 👁 + AI
        </span>
      </footer>

      {/* Toast */}
      {toast && (
        <div style={{
          ...s.toast,
          borderColor: toast.type === 'success' ? 'rgba(0,229,160,0.3)' : 'rgba(255,77,109,0.3)',
          animation: 'slideUpToast 0.35s cubic-bezier(0.34,1.56,0.64,1) both'
        }}>
          <span style={{ fontSize: 18 }}>{toast.type === 'success' ? '✓' : '✗'}</span>
          {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: #00e5a0 !important; box-shadow: 0 0 0 3px rgba(0,229,160,0.1); }
        input::placeholder { color: #5a5a75; }
        @keyframes slideUpToast {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulseDot { 50% { transform: scale(1.4); opacity: 0.5; } }
        @keyframes pulseLive { 50% { opacity: 0.3; transform: scale(1.3); } }
      `}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────

function Field({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#5a5a75', fontFamily: "'Space Mono', monospace" }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' }}>{icon}</span>
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#252535' }} />
      <span style={{ fontSize: 11, color: '#5a5a75', fontFamily: "'Space Mono', monospace" }}>or</span>
      <div style={{ flex: 1, height: 1, background: '#252535' }} />
    </div>
  )
}

function GoogleBtn({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer',
        background: 'transparent', border: `1px solid ${hov ? '#00e5a0' : '#252535'}`,
        color: hov ? '#00e5a0' : '#e8e8f2', fontFamily: "'Syne', sans-serif",
        fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 10, transition: 'all 0.18s'
      }}>
      <svg width="16" height="16" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continue with Google
    </button>
  )
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16, borderRadius: '50%',
      border: '2px solid rgba(0,0,0,0.25)', borderTopColor: '#000',
      display: 'inline-block', animation: 'spin 0.65s linear infinite'
    }} />
  )
}

// ── Styles ────────────────────────────────────────────────────────

const s = {
  root: {
    background: '#0a0a0f', color: '#e8e8f2', minHeight: '100vh',
    fontFamily: "'Syne', sans-serif", overflowX: 'hidden',
    display: 'flex', flexDirection: 'column', position: 'relative'
  },
  bgGrid: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundImage: 'linear-gradient(rgba(0,229,160,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.028) 1px, transparent 1px)',
    backgroundSize: '44px 44px'
  },
  bgGlow: {
    position: 'fixed', zIndex: 0, pointerEvents: 'none',
    width: 700, height: 700, borderRadius: '50%',
    filter: 'blur(120px)', opacity: 0.1
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 60px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(16px)'
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px'
  },
  logoMark: {
    width: 40, height: 40, borderRadius: 12, background: '#00e5a0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, color: '#000', boxShadow: '0 0 20px rgba(0,229,160,0.35)'
  },
  navGhost: { padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', background: 'transparent', color: '#5a5a75', cursor: 'pointer', fontFamily: "'Syne', sans-serif" },
  navOutline: { padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'transparent', color: '#00e5a0', border: '1px solid rgba(0,229,160,0.4)', cursor: 'pointer', fontFamily: "'Syne', sans-serif" },
  navSolid: { padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: '#00e5a0', color: '#000', border: 'none', cursor: 'pointer', fontFamily: "'Syne', sans-serif" },
  sessionBadge: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5a5a75', fontFamily: "'Space Mono', monospace" },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#00e5a0', animation: 'pulseLive 1.5s infinite' },
  hero: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80, padding: '80px 60px 60px', position: 'relative', zIndex: 1 },
  heroLeft: { flex: 1, maxWidth: 580 },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20,
    background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)',
    fontSize: 11, fontFamily: "'Space Mono', monospace", color: '#00e5a0',
    letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 28
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: '50%', background: '#00e5a0', animation: 'pulseDot 1.5s infinite' },
  heroTitle: { fontSize: 'clamp(42px, 5vw, 68px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 22 },
  heroDesc: { fontSize: 17, color: '#5a5a75', lineHeight: 1.7, maxWidth: 460, marginBottom: 40 },
  ctaPrimary: { padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: '#00e5a0', color: '#000', border: 'none', cursor: 'pointer', fontFamily: "'Syne', sans-serif", boxShadow: '0 4px 24px rgba(0,229,160,0.25)' },
  ctaSecondary: { padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: 'transparent', color: '#e8e8f2', border: '1px solid #252535', cursor: 'pointer', fontFamily: "'Syne', sans-serif" },
  statsRow: { display: 'flex', gap: 32, marginTop: 48, paddingTop: 40, borderTop: '1px solid #252535' },
  statLabel: { fontSize: 11, color: '#5a5a75', fontFamily: "'Space Mono', monospace", letterSpacing: '1px', marginTop: 4 },
  heroRight: { flexShrink: 0, width: 420, position: 'relative', zIndex: 1 },
  authCard: {
    background: '#15151f', border: '1px solid #252535', borderRadius: 20, padding: 36,
    boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
    position: 'relative', overflow: 'hidden'
  },
  cardTopLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #00e5a0, #7c5cfc, transparent)' },
  tabs: { display: 'flex', background: '#11111a', borderRadius: 10, padding: 4, marginBottom: 24 },
  tab: { flex: 1, padding: 9, textAlign: 'center', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'transparent', color: '#5a5a75', fontFamily: "'Syne', sans-serif", transition: 'all 0.2s' },
  tabActive: { background: '#00e5a0', color: '#000' },
  msg: { padding: '10px 14px', borderRadius: 8, fontSize: 12, fontFamily: "'Space Mono', monospace", marginBottom: 14 },
  msgError: { background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.25)', color: '#ff4d6d' },
  msgSuccess: { background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)', color: '#00e5a0' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { width: '100%', background: '#11111a', border: '1px solid #252535', borderRadius: 9, padding: '11px 14px 11px 40px', color: '#e8e8f2', fontFamily: "'Syne', sans-serif", fontSize: 14, transition: 'all 0.18s' },
  authBtn: { width: '100%', padding: 13, borderRadius: 10, border: 'none', background: '#00e5a0', color: '#000', fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerTxt: { textAlign: 'center', fontSize: 12, color: '#5a5a75', fontFamily: "'Space Mono', monospace" },
  link: { color: '#00e5a0', cursor: 'pointer' },
  features: { padding: '60px 60px', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 1 },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1100, margin: '0 auto' },
  featureCard: { background: '#15151f', border: '1px solid #252535', borderRadius: 16, padding: 28 },
  featureIcon: { width: 48, height: 48, borderRadius: 12, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 },
  footer: { padding: '20px 60px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 },
  toast: { position: 'fixed', bottom: 28, right: 28, zIndex: 9999, padding: '14px 20px', borderRadius: 12, fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, background: '#15151f', border: '1px solid #252535', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }
}