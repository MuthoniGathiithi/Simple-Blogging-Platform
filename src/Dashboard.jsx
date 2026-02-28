import { useState, useCallback, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import WebcamCapture from '../components/WebcamCapture'
import StudentList from '../components/StudentList'
import { recognizeFace, getSessions, createSession, closeSession } from '../api/client'

export default function MarkAttendance() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastMatch, setLastMatch] = useState(null)
  const [presentIds, setPresentIds] = useState([])
  const [log, setLog] = useState([])
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSessionForm, setNewSessionForm] = useState({ title: '', course: 'CS101' })

  useEffect(() => { loadSessions() }, [])

  const loadSessions = async () => {
    try {
      const data = await getSessions()
      setSessions(data)
      // Auto-select first active session
      const active = data.find(s => s.is_active)
      if (active) setActiveSession(active)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateSession = async () => {
    if (!newSessionForm.title || !newSessionForm.course) return
    try {
      const session = await createSession(newSessionForm)
      setSessions(prev => [session, ...prev])
      setActiveSession(session)
      setShowNewSession(false)
      setNewSessionForm({ title: '', course: 'CS101' })
      toast.success(`Session "${session.title}" started!`)
    } catch (e) {
      toast.error('Failed to create session')
    }
  }

  const handleCloseSession = async () => {
    if (!activeSession) return
    try {
      await closeSession(activeSession.id)
      setIsScanning(false)
      setActiveSession(prev => ({ ...prev, is_active: false }))
      toast.success('Session closed')
    } catch (e) {
      toast.error('Failed to close session')
    }
  }

  const handleCapture = useCallback(async (imageData) => {
    if (!activeSession) {
      toast.error('No active session. Create a session first.')
      return
    }
    try {
      const result = await recognizeFace(imageData, activeSession.id)
      setLastMatch({
        matched: result.matched,
        name: result.student?.name,
        confidence: result.confidence
      })

      if (result.matched) {
        const studentId = result.student?.id
        setPresentIds(prev => prev.includes(studentId) ? prev : [...prev, studentId])

        const entry = {
          id: Date.now(),
          name: result.student.name,
          studentId: result.student.student_id,
          confidence: result.confidence,
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          status: 'present'
        }
        setLog(prev => [entry, ...prev.slice(0, 49)])
        toast.success(`✓ ${result.student.name} marked present`, { icon: '👤' })
      } else {
        toast.error(result.message || 'Face not recognized', { duration: 2000 })
      }
    } catch (e) {
      const msg = e.response?.data?.detail || 'Recognition failed'
      toast.error(msg)
    }

    // Clear match overlay after 2.5s
    setTimeout(() => setLastMatch(null), 2500)
  }, [activeSession])

  return (
    <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
      {/* Left: student list */}
      <StudentList presentIds={presentIds} course={activeSession?.course} />

      {/* Center + Right */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Session bar */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Session selector */}
          <select
            className="form-input form-select"
            style={{ width: 260 }}
            value={activeSession?.id || ''}
            onChange={e => {
              const s = sessions.find(s => s.id === parseInt(e.target.value))
              setActiveSession(s || null)
              setIsScanning(false)
              setPresentIds([])
              setLog([])
            }}>
            <option value="">— Select a session —</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} · {s.course} {s.is_active ? '(Active)' : '(Closed)'}
              </option>
            ))}
          </select>

          <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowNewSession(true)}>
            + New Session
          </button>

          {activeSession?.is_active && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setIsScanning(prev => !prev)}>
                {isScanning ? '⏸ Pause Scan' : '▶ Start Scan'}
              </button>
              <button className="btn btn-danger" style={{ fontSize: 13 }} onClick={handleCloseSession}>
                ✕ Close Session
              </button>
            </>
          )}
        </div>

        {/* New session modal */}
        {showNewSession && (
          <div className="card animate-slide-up" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Create New Session</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label">Session Title</label>
                <input className="form-input" placeholder="e.g. Morning Lecture"
                  value={newSessionForm.title}
                  onChange={e => setNewSessionForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Course</label>
                <input className="form-input" placeholder="e.g. CS101"
                  value={newSessionForm.course}
                  onChange={e => setNewSessionForm(p => ({ ...p, course: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleCreateSession}>Create</button>
                <button className="btn btn-secondary" onClick={() => setShowNewSession(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Main content: camera + panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          {/* Camera */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <WebcamCapture
              onCapture={handleCapture}
              autoScan={true}
              scanInterval={3500}
              isScanning={isScanning && !!activeSession?.is_active}
              lastMatch={lastMatch}
            />
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Last match card */}
            <div className="card">
              <div className="label" style={{ marginBottom: 14 }}>Last Match</div>
              {lastMatch?.matched ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 68, height: 68, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 800, color: '#000',
                    border: '3px solid var(--accent)',
                    boxShadow: '0 0 24px rgba(0,229,160,0.3)'
                  }}>
                    {lastMatch.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{lastMatch.name}</div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontFamily: "'Space Mono',monospace", marginBottom: 6 }}>
                      <span>Confidence</span>
                      <span style={{ color: 'var(--accent)' }}>{lastMatch.confidence}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', width: 200 }}>
                      <div style={{ height: '100%', width: `${lastMatch.confidence}%`, background: 'linear-gradient(90deg, var(--accent2), var(--accent))', borderRadius: 3, animation: 'fillBar 0.6s ease both' }} />
                    </div>
                  </div>
                  <span className="badge badge-present" style={{ fontSize: 12, padding: '6px 16px' }}>✓ MARKED PRESENT</span>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                  <div className="mono" style={{ fontSize: 11 }}>{isScanning ? 'SCANNING...' : 'NOT SCANNING'}</div>
                </div>
              )}
            </div>

            {/* Activity log */}
            <div className="card" style={{ flex: 1 }}>
              <div className="label" style={{ marginBottom: 12 }}>Activity Log</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                {log.length === 0 ? (
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', paddingTop: 16 }}>
                    NO ACTIVITY YET
                  </div>
                ) : log.map(entry => (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, fontFamily: "'Space Mono', monospace",
                    color: 'var(--muted)', padding: '6px 8px',
                    borderRadius: 6, background: 'var(--surface)',
                    animation: 'slideIn 0.3s ease both'
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--muted)' }}>{entry.time}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 700 }}>{entry.name}</span>
                    <span style={{ color: 'var(--accent)', marginLeft: 'auto', fontSize: 10 }}>{entry.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}