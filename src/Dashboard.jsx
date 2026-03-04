import { useState, useEffect } from 'react'
import { useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { supabase } from './supabase_client'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser]               = useState(null)
  const [sideOpen, setSide]           = useState(true)
  const [time, setTime]               = useState(new Date())
  const [loading, setLoading]         = useState(true)
  const [stats, setStats]             = useState({ students: 0, sessionsToday: 0, presentToday: 0, absentToday: 0 })
  const [recentSessions, setSessions] = useState([])
  const [recentStudents, setStudents] = useState([])
  const [weekData]                    = useState([
    { day: 'Mon', rate: 0 }, { day: 'Tue', rate: 0 }, { day: 'Wed', rate: 0 },
    { day: 'Thu', rate: 0 }, { day: 'Fri', rate: 0 }, { day: 'Sat', rate: 0 }, { day: 'Sun', rate: 0 },
  ])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadData(user.id)
    })
    const tick = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const loadData = async (uid) => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      const { count: studentCount } = await supabase
        .from('students').select('*', { count: 'exact', head: true }).eq('teacher_id', uid)

      const { data: todaySessions } = await supabase
        .from('attendance_sessions').select('id').eq('teacher_id', uid).eq('date', today)

      const { data: allSessions } = await supabase
        .from('attendance_sessions').select('id, title, course, date, is_active')
        .eq('teacher_id', uid).order('created_at', { ascending: false }).limit(4)

      const sessionIds = (todaySessions || []).map(s => s.id)
      let presentToday = 0
      if (sessionIds.length > 0) {
        const { count } = await supabase
          .from('attendance_records').select('*', { count: 'exact', head: true })
          .in('session_id', sessionIds).eq('status', 'present')
        presentToday = count || 0
      }

      const sessionsWithCounts = await Promise.all(
        (allSessions || []).map(async (sess) => {
          const { count: present } = await supabase
            .from('attendance_records').select('*', { count: 'exact', head: true })
            .eq('session_id', sess.id).eq('status', 'present')
          const { count: total } = await supabase
            .from('students').select('*', { count: 'exact', head: true })
            .eq('teacher_id', uid).eq('course', sess.course)
          const p = present || 0
          const t = total || 0
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          return { ...sess, present: p, total: t, rate: t > 0 ? Math.round((p / t) * 100) : 0,
            dateLabel: sess.date === today ? 'Today' : sess.date === yesterday ? 'Yesterday' : sess.date }
        })
      )

      const { data: students } = await supabase
        .from('students').select('id, name, student_id, course')
        .eq('teacher_id', uid).order('registered_at', { ascending: false }).limit(5)

      setStats({
        students: studentCount || 0,
        sessionsToday: (todaySessions || []).length,
        presentToday,
        absentToday: Math.max(0, (studentCount || 0) - presentToday),
      })
      setSessions(sessionsWithCounts)
      setStudents(students || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Teacher'
  const initials    = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const location = useLocation()

  return (
    <div style={s.shell}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box} a{text-decoration:none}
        aside{transition:width 0.25s ease}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#0a0a0f}
        ::-webkit-scrollbar-thumb{background:#252535;border-radius:2px}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ ...s.sidebar, width: sideOpen ? 240 : 68 }}>
        <div style={s.sideTop}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={s.logoMark}>👁</div>
            {sideOpen && <span style={{ fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap' }}>Face<span style={{ color: '#00e5a0' }}>Attend</span></span>}
          </div>
          <button style={s.iconBtn} onClick={() => setSide(p => !p)}>{sideOpen ? '←' : '→'}</button>
        </div>

          <nav style={s.sideNav}>
          {[
            { icon: '▦', label: 'Dashboard',  path: '/dashboard',          end: true },
            { icon: '👁', label: 'Attendance', path: '/dashboard/attend'             },
            { icon: '🏷', label: 'Courses',    path: '/dashboard/courses'           },
          ].map(({ icon, label, path, end }) => (
            <NavLink key={path} to={path} end={end}
              style={({ isActive }) => ({
                ...s.navItem,
                background: isActive ? 'rgba(0,229,160,0.1)' : 'transparent',
                color:      isActive ? '#00e5a0' : '#5a5a75',
                borderLeft: isActive ? '2px solid #00e5a0' : '2px solid transparent',
                justifyContent: sideOpen ? 'flex-start' : 'center',
              })}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              {sideOpen && <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ ...s.sideUser, justifyContent: sideOpen ? 'flex-start' : 'center' }}>
          <div style={s.avatar}>{initials}</div>
          {sideOpen && <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e8e8f2' }}>{displayName}</div>
              <div style={{ fontSize: 10, color: '#5a5a75', fontFamily: 'Space Mono,monospace' }}>Teacher</div>
            </div>
            <button style={s.iconBtn} onClick={handleLogout} title="Log out">⏏</button>
          </>}
        </div>
      </aside>

      {/* MAIN */}
      <div style={s.main}>

        {/* Topbar */}
        <header style={s.topbar}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>
              Good {getGreeting()},&nbsp;<span style={{ color: '#00e5a0' }}>{displayName.split(' ')[0]}</span> 👋
            </h1>
            <div style={{ fontSize: 12, color: '#5a5a75', fontFamily: 'Space Mono,monospace', marginTop: 4 }}>
              {time.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              &nbsp;·&nbsp;<span style={{ color: '#00e5a0' }}>{time.toLocaleTimeString('en-GB')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={s.btnSec} onClick={() => navigate('/dashboard/sessions')}>+ New Session</button>
            <button style={s.btnPri} onClick={() => navigate('/dashboard/attend')}>▶ Start Attendance</button>
          </div>
        </header>

        <div style={s.content}>
          {location.pathname === '/dashboard' ? (
            <>
              {/* STAT CARDS */}
              <div style={s.statsGrid}>
                {[
                  { icon: '👥', label: 'Total Students',  value: stats.students,      sub: stats.students === 0 ? 'No students yet' : `${stats.students} registered`,          color: '#00e5a0', bg: 'rgba(0,229,160,0.08)'  },
                  { icon: '📋', label: 'Sessions Today',  value: stats.sessionsToday, sub: stats.sessionsToday === 0 ? 'No sessions today' : `${stats.sessionsToday} created`, color: '#7c5cfc', bg: 'rgba(124,92,252,0.08)' },
                  { icon: '✓',  label: 'Present Today',   value: stats.presentToday,  sub: stats.presentToday === 0 ? 'No attendance yet' : `${stats.presentToday} marked`,    color: '#00e5a0', bg: 'rgba(0,229,160,0.08)'  },
                  { icon: '✗',  label: 'Absent Today',    value: stats.absentToday,   sub: stats.absentToday === 0 ? 'No absences yet' : `${stats.absentToday} absent`,         color: '#ff4d6d', bg: 'rgba(255,77,109,0.08)' },
                ].map((c, i) => (
                  <div key={i} style={s.statCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.icon}</div>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: c.color, lineHeight: 1, marginTop: 12 }}>
                      {loading ? '—' : c.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#5a5a75', fontFamily: 'Space Mono,monospace', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: '#5a5a75', fontFamily: 'Space Mono,monospace', marginTop: 6 }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* MIDDLE ROW */}
              <div style={{ display: 'flex', gap: 16 }}>

                {/* Chart */}
                <div style={{ ...s.card, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={s.cardTitle}>Weekly Attendance Rate</div>
                      <div style={s.cardSub}>Average across all courses</div>
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 800, color: '#00e5a0', lineHeight: 1 }}>
                      0<span style={{ fontSize: 18, color: '#5a5a75' }}>%</span>
                    </div>
                  </div>
                  <Empty icon="📊" text="Attendance data will appear here after your first session" />
                </div>

                {/* Quick actions */}
                <div style={{ ...s.card, width: 240, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={s.cardTitle}>Quick Actions</div>
                  {[
                    { icon: '👁', label: 'Mark Attendance',  path: '/dashboard/attend'   },
                    { icon: '🏷', label: 'Courses',          path: '/dashboard/courses'  },
                  ].map(({ icon, label, path }) => (
                    <button key={path} onClick={() => navigate(path)} style={s.qaBtn}>
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                      <span style={{ marginLeft: 'auto', color: '#5a5a75' }}>→</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTTOM ROW */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

                {/* Recent sessions */}
                <div style={{ ...s.card, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={s.cardTitle}>Recent Sessions</div>
                    <button style={s.linkBtn} onClick={() => navigate('/dashboard/sessions')}>View all →</button>
                  </div>
                  {recentSessions.length === 0 ? (
                    <Empty icon="📋" text="No sessions yet. Create your first session to get started."
                      action={{ label: '+ Create Session', onClick: () => navigate('/dashboard/sessions') }} />
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr>{['SESSION','COURSE','DATE','PRESENT','RATE'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {recentSessions.map(sess => (
                          <tr key={sess.id} style={{ borderBottom: '1px solid #1a1a28', cursor: 'pointer' }}>
                            <td style={s.td}><span style={{ fontWeight: 600 }}>{sess.title}</span></td>
                            <td style={s.td}><span style={s.badge}>{sess.course}</span></td>
                            <td style={{ ...s.td, color: '#5a5a75', fontFamily: 'Space Mono,monospace', fontSize: 11 }}>{sess.dateLabel}</td>
                            <td style={s.td}><span style={{ color: '#00e5a0', fontWeight: 700 }}>{sess.present}</span><span style={{ color: '#5a5a75', fontSize: 11 }}>/{sess.total}</span></td>
                            <td style={s.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 60, height: 4, background: '#1a1a28', borderRadius: 2, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${sess.rate}%`, background: sess.rate >= 85 ? '#00e5a0' : sess.rate >= 70 ? '#ffb830' : '#ff4d6d', borderRadius: 2 }} />
                                </div>
                                <span style={{ fontSize: 12, fontFamily: 'Space Mono,monospace' }}>{sess.rate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Students */}
                <div style={{ ...s.card, width: 280 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={s.cardTitle}>Students</div>
                    <button style={s.linkBtn} onClick={() => navigate('/dashboard/courses')}>Add new →</button>
                  </div>
                  {recentStudents.length === 0 ? (
                    <Empty icon="👥" text="No students registered yet."
                      action={{ label: '+ Register Student', onClick: () => navigate('/dashboard/register') }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {recentStudents.map((st, i) => {
                        const colors = ['#00e5a0','#7c5cfc','#ffb830','#ff4d6d','#00b4d8']
                        const c = colors[i % colors.length]
                        return (
                          <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: '#11111a', border: '1px solid #1a1a28', borderLeft: `3px solid ${c}` }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `${c}20`, color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                              {st.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.name}</div>
                              <div style={{ fontSize: 10, color: '#5a5a75', fontFamily: 'Space Mono,monospace' }}>{st.student_id} · {st.course}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  )
}

function Empty({ icon, text, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 20px', color: '#5a5a75' }}>
      <div style={{ fontSize: 30, marginBottom: 10, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 12, fontFamily: 'Space Mono,monospace', lineHeight: 1.6 }}>{text}</div>
      {action && (
        <button onClick={action.onClick} style={{ marginTop: 14, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,229,160,0.3)', background: 'rgba(0,229,160,0.06)', color: '#00e5a0', fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
}

const s = {
  shell:     { display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f2', fontFamily: 'Syne,sans-serif', backgroundImage: 'linear-gradient(rgba(0,229,160,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,160,0.02) 1px,transparent 1px)', backgroundSize: '44px 44px' },
  sidebar:   { flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a1a28', background: '#0d0d15', height: '100vh', position: 'sticky', top: 0, overflow: 'hidden' },
  sideTop:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px', borderBottom: '1px solid #1a1a28', gap: 8 },
  logoMark:  { width: 36, height: 36, borderRadius: 10, background: '#00e5a0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#000' },
  iconBtn:   { width: 28, height: 28, borderRadius: 6, border: '1px solid #252535', background: 'transparent', color: '#5a5a75', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sideNav:   { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem:   { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, transition: 'all 0.18s', fontFamily: 'Syne,sans-serif' },
  sideUser:  { display: 'flex', alignItems: 'center', gap: 10, padding: '16px', borderTop: '1px solid #1a1a28', overflow: 'hidden' },
  avatar:    { width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(0,229,160,0.15)', color: '#00e5a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 },
  main:      { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid #1a1a28', background: 'rgba(13,13,21,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 },
  btnPri:    { padding: '10px 20px', borderRadius: 9, border: 'none', background: '#00e5a0', color: '#000', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSec:    { padding: '10px 20px', borderRadius: 9, border: '1px solid #252535', background: 'transparent', color: '#e8e8f2', fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  content:   { flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
  statCard:  { background: '#13131e', border: '1px solid #1a1a28', borderRadius: 14, padding: '20px 22px' },
  card:      { background: '#13131e', border: '1px solid #1a1a28', borderRadius: 14, padding: '20px 22px' },
  cardTitle: { fontSize: 15, fontWeight: 700 },
  cardSub:   { fontSize: 11, color: '#5a5a75', fontFamily: 'Space Mono,monospace', marginTop: 2 },
  linkBtn:   { background: 'transparent', border: 'none', color: '#00e5a0', fontSize: 12, fontFamily: 'Space Mono,monospace', cursor: 'pointer', padding: 0 },
  qaBtn:     { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, border: '1px solid #1a1a28', background: '#11111a', cursor: 'pointer', fontFamily: 'Syne,sans-serif', color: '#e8e8f2', width: '100%', transition: 'all 0.18s' },
  th:        { padding: '8px 12px', textAlign: 'left', fontSize: 9, letterSpacing: '1.5px', color: '#5a5a75', fontFamily: 'Space Mono,monospace', fontWeight: 400, borderBottom: '1px solid #1a1a28' },
  td:        { padding: '11px 12px', fontSize: 13 },
  badge:     { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: 'rgba(124,92,252,0.12)', color: '#7c5cfc', fontFamily: 'Space Mono,monospace' },
}