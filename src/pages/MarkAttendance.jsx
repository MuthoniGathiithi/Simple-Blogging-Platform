import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase_client'

export default function MarkAttendance() {
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState('')
  const [photos, setPhotos] = useState([])
  const [message, setMessage] = useState(null)

  useEffect(() => { loadCourses() }, [])

  async function loadCourses() {
    try {
      const { data } = await supabase.from('courses').select('id,title,code')
      setCourses(data || [])
      if (data && data[0]) setSelected(data[0].id)
    } catch (err) { console.error(err) }
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files || [])
    // append but cap at 6
    setPhotos(prev => {
      const combined = [...prev, ...files]
      return combined.slice(0, 6)
    })
  }

  function clearPhotos() { setPhotos([]) }

  function startDetection() {
    if (!selected) return setMessage({ type: 'error', text: 'Select a course first' })
    if (photos.length < 3) return setMessage({ type: 'error', text: 'Upload at least 3 photos (min 3, max 6)' })
    if (photos.length > 6) return setMessage({ type: 'error', text: 'Maximum 6 photos allowed' })
    // Placeholder: here you'd run client-side embedding extraction (e.g. face-api.js)
    setMessage({ type: 'info', text: 'Running detection (stub). In production this extracts embeddings from images and matches per-course.' })
  }

  return (
    <div style={{ color: 'var(--text)' }}>
      <h2>Mark Attendance</h2>
      <p style={{ color: '#5a5a75' }}>Upload 3–6 classroom photos or start live detection. Embeddings are matched per-course.</p>

      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div style={{ width: 360, background: '#11111a', border: '1px solid #1a1a28', padding: 16, borderRadius: 12 }}>
          <label style={{ fontSize: 13 }}>Course</label>
          <select value={selected} onChange={e => setSelected(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, background: '#0f0f16', color: '#e8e8f2', border: '1px solid #252535' }}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title} {c.code ? `· ${c.code}` : ''}</option>)}
          </select>

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13 }}>Upload photos (3–6)</label>
            <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ width: '100%', marginTop: 8 }} />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {photos.map((f, i) => (
                <div key={i} style={{ width: 80, height: 56, background: '#0b0b0f', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#5a5a75', overflow: 'hidden' }}>{f.name}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={startDetection} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#00e5a0', color: '#000', cursor: 'pointer' }}>Start Detection</button>
              <button onClick={clearPhotos} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #252535', background: 'transparent', color: '#e8e8f2' }}>Clear</button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Binance-style Live Detection (guidance)</h3>
          <ol style={{ color: '#5a5a75' }}>
            <li>Ensure camera has clear view of the classroom.</li>
            <li>Ask students to face forward, ensure good lighting.</li>
            <li>Capture 2–3 photos from different angles or run live capture.</li>
            <li>The system extracts embeddings per face and matches only against students registered in this course.</li>
            <li>Review matches and confidence scores before saving attendance.</li>
          </ol>
          <div style={{ marginTop: 12, color: '#5a5a75' }}>
            Note: This page shows a scaffold. I can implement a live capture using `face-api.js` or `@vladmandic/face-api` to extract embeddings in-browser and run nearest-neighbour matching against course embeddings stored in Supabase.
          </div>
        </div>
      </div>

      {message && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: message.type === 'error' ? '#2a0b0f' : '#072216', color: '#9ff3c8' }}>{message.text}</div>}
    </div>
  )
}

