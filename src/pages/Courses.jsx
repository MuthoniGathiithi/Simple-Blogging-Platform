import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase_client'
import { useNavigate } from 'react-router-dom'

export default function Courses() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(true)
  const [regModal, setRegModal] = useState(null) // { id, title, link }
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [schedule, setSchedule] = useState('')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { loadCourses() }, [])

  async function loadCourses() {
    try {
      const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(50)
      setCourses(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const nameRef = useRef(null)

  async function handleCreate(e) {
    e?.preventDefault()
    if (!name) return setMsg({ type: 'error', text: 'Course name required' })
    setLoading(true); setMsg(null)
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('courses')
        .insert([{
          title: name,
          code,
          schedule,
          teacher_id: user.data.user.id
        }])
        .select()
        .single()
      if (error) throw error
      setMsg({ type: 'success', text: 'Course created' })
      setName(''); setCode(''); setSchedule('')
      setCourses(prev => [data, ...prev])
      // hide form after creating a class; show top-level create button
      setShowForm(false)
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally { setLoading(false) }
  }

  const regLink = (id) => `${window.location.origin}/register?course=${id}`

  return (
    <div style={{ color: 'var(--text)' }}>
      <h2>Courses</h2>
      <p style={{ color: '#5a5a75' }}>Create classes and generate a per-course registration link — embeddings will be stored per-course.</p>

      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <div style={{ width: 360 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Create Class</h3>
            {!showForm && <button onClick={() => setShowForm(true)} style={s.btn}>+ New Class</button>}
          </div>

          {showForm && (
            <div style={{ background: '#11111a', border: '1px solid #1a1a28', padding: 16, borderRadius: 12 }}>
              {msg && <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: msg.type === 'error' ? '#2a0b0f' : '#072216', color: msg.type === 'error' ? '#ffb6be' : '#9ff3c8' }}>{msg.text}</div>}
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13 }}>Course name</label>
                <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} style={s.input} />
                <label style={{ fontSize: 13 }}>Course code</label>
                <input value={code} onChange={e => setCode(e.target.value)} style={s.input} />
                <label style={{ fontSize: 13 }}>Schedule / time</label>
                <input value={schedule} onChange={e => setSchedule(e.target.value)} style={s.input} placeholder="e.g. Mon & Wed 10:00-11:30" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleCreate} style={s.btn} disabled={loading}>{loading ? 'Creating…' : 'Create Class'}</button>
                  <button type="button" onClick={() => { setName(''); setCode(''); setSchedule('') }} style={s.ghost}>Clear</button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Your classes</h3>
          {courses.length === 0 ? (
            <div style={{ color: '#5a5a75', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>No classes yet.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={s.btn} onClick={() => setShowForm(true)}>+ Create Class</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {courses.map(c => (
                <div key={c.id} style={{ background: '#11111a', border: '1px solid #1a1a28', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.title} {c.code ? <span style={{ color: '#5a5a75', marginLeft: 8 }}>{c.code}</span> : null}</div>
                    <div style={{ fontSize: 12, color: '#5a5a75' }}>{c.schedule}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button style={s.linkBtn} onClick={() => setRegModal({ id: c.id, title: c.title, link: regLink(c.id) })}>Register Student</button>
                    <button style={s.linkBtn} onClick={() => navigator.clipboard?.writeText(regLink(c.id))}>Copy reg link</button>
                    <button style={s.linkBtn} onClick={() => navigate(`/dashboard/sessions?course=${c.id}`)}>Open</button>
                    <button style={s.linkBtn} onClick={() => navigate(`/dashboard/attend?course=${c.id}`)}>Mark Attendance</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Register modal */}
      {regModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 480, background: '#0f0f16', border: '1px solid #1a1a28', padding: 18, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{regModal.title}</div>
                <div style={{ fontSize: 12, color: '#5a5a75' }}>Share this link to allow students to register for this class</div>
              </div>
              <button onClick={() => setRegModal(null)} style={s.linkBtn}>Close</button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <input readOnly value={regModal.link} style={{ flex: 1, padding: 8, borderRadius: 8, background: '#0b0b0f', border: '1px solid #252535', color: '#e8e8f2' }} />
              <button onClick={() => navigator.clipboard?.writeText(regModal.link)} style={s.btn}>Copy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  input: { padding: 8, borderRadius: 8, border: '1px solid #252535', background: '#0f0f16', color: '#e8e8f2' },
  btn: { padding: '8px 12px', borderRadius: 8, border: 'none', background: '#00e5a0', color: '#000', fontWeight: 700, cursor: 'pointer' },
  ghost: { padding: '8px 12px', borderRadius: 8, border: '1px solid #252535', background: 'transparent', color: '#e8e8f2', cursor: 'pointer' },
  linkBtn: { border: 'none', background: 'transparent', color: '#00e5a0', cursor: 'pointer' }
}
