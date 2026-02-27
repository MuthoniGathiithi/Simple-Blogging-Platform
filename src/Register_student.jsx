import { useState, useCallback, useRef } from 'react'
import Webcam from 'react-webcam'
import toast from 'react-hot-toast'
import { registerStudent } from '../api/client'

const VIDEO_CONSTRAINTS = { width: 640, height: 480, facingMode: 'user' }

export default function RegisterStudent() {
  const webcamRef = useRef(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ student_id: '', name: '', course: '', email: '' })

  const capture = useCallback(() => {
    const img = webcamRef.current?.getScreenshot()
    if (img) setCapturedImage(img)
  }, [webcamRef])

  const retake = () => setCapturedImage(null)

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!form.student_id || !form.name || !form.course) {
      toast.error('Please fill in all required fields')
      return
    }
    if (!capturedImage) {
      toast.error('Please capture a face photo first')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('student_id', form.student_id)
      fd.append('name', form.name)
      fd.append('course', form.course)
      fd.append('email', form.email)
      fd.append('image_data', capturedImage)

      await registerStudent(fd)
      toast.success(`${form.name} registered successfully! 🎉`)
      // Reset form
      setForm({ student_id: '', name: '', course: '', email: '' })
      setCapturedImage(null)
    } catch (e) {
      const msg = e.response?.data?.detail || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, maxWidth: 1000 }}>

      {/* Camera panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Camera or captured image */}
          <div style={{ background: '#0a0a0f', position: 'relative', aspectRatio: '4/3' }}>
            {capturedImage ? (
              <>
                <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', top: 16, left: 16,
                  background: 'rgba(0,229,160,0.15)', border: '1px solid var(--accent)',
                  borderRadius: 8, padding: '6px 14px',
                  fontSize: 11, fontFamily: "'Space Mono',monospace", color: 'var(--accent)', fontWeight: 700
                }}>
                  ✓ FACE CAPTURED
                </div>
              </>
            ) : (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={VIDEO_CONSTRAINTS}
                  onUserMedia={() => setReady(true)}
                  mirrored
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: ready ? 'block' : 'none' }}
                  screenshotQuality={0.95}
                />
                {!ready && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                    <FaceFrame />
                    <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>INITIALIZING CAMERA...</span>
                  </div>
                )}
                {ready && <FaceFrame label="POSITION FACE IN FRAME" />}
              </>
            )}

            {/* Bottom overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '16px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
              display: 'flex', gap: 10, justifyContent: 'center'
            }}>
              {!capturedImage ? (
                <button
                  onClick={capture}
                  disabled={!ready}
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'var(--accent)', border: '3px solid rgba(255,255,255,0.2)',
                    fontSize: 24, color: '#000', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                  📷
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={retake}>
                  🔁 Retake Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="card" style={{ padding: 16 }}>
          <div className="label" style={{ marginBottom: 10 }}>Tips for Best Results</div>
          {[
            '✦ Ensure good, even lighting on your face',
            '✦ Look directly at the camera',
            '✦ Remove glasses or hat if possible',
            '✦ Face should fill most of the frame',
          ].map((tip, i) => (
            <div key={i} className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{tip}</div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
            Student <span style={{ color: 'var(--accent)' }}>Information</span>
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>
            Fill in details and capture face to register
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Student ID *</label>
                <input className="form-input" name="student_id" placeholder="STD-001"
                  value={form.student_id} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Course *</label>
                <input className="form-input" name="course" placeholder="CS101"
                  value={form.course} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="name" placeholder="e.g. Alice Kamau"
                value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <input className="form-input" name="email" placeholder="alice@university.edu" type="email"
                value={form.email} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="card" style={{ padding: 16 }}>
          <div className="label" style={{ marginBottom: 12 }}>Registration Checklist</div>
          <CheckItem done={!!form.student_id && !!form.name && !!form.course} label="Student details filled" />
          <CheckItem done={!!capturedImage} label="Face photo captured" />
          <CheckItem done={false} label="Embeddings extracted & stored" note="(done automatically)" />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px 24px' }}
          onClick={handleSubmit}
          disabled={loading}>
          {loading ? (
            <>
              <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #000', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Processing Face...
            </>
          ) : '✓ Register Student & Save Embeddings'}
        </button>
      </div>
    </div>
  )
}

function FaceFrame({ label }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{
        width: 180, height: 210,
        border: '2px solid var(--accent)',
        borderRadius: '50% 50% 45% 45%',
        position: 'relative',
        boxShadow: '0 0 30px rgba(0,229,160,0.15)',
        opacity: 0.75
      }}>
        {[
          { top: -2, left: -2, borderWidth: '2px 0 0 2px' },
          { top: -2, right: -2, borderWidth: '2px 2px 0 0' },
          { bottom: -2, left: -2, borderWidth: '0 0 2px 2px' },
          { bottom: -2, right: -2, borderWidth: '0 2px 2px 0' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 20, height: 20, borderColor: 'var(--accent)', borderStyle: 'solid', ...s }} />
        ))}
      </div>
      {label && (
        <div className="mono" style={{ position: 'absolute', bottom: 60, fontSize: 11, color: 'var(--accent)', letterSpacing: 2 }}>
          {label}
        </div>
      )}
    </div>
  )
}

function CheckItem({ done, label, note }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: done ? 'rgba(0,229,160,0.15)' : 'var(--surface)',
        border: `1px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: done ? 'var(--accent)' : 'var(--muted)',
        transition: 'all 0.3s'
      }}>
        {done ? '✓' : '○'}
      </div>
      <span style={{ fontSize: 13, color: done ? 'var(--text)' : 'var(--muted)' }}>
        {label} {note && <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{note}</span>}
      </span>
    </div>
  )
}