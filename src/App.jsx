import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { supabase } from './supabase_client'
import Landing from './landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './Dashboard'
import Layout from './components/Layout'
import MarkAttendance from './pages/MarkAttendance'
import RegisterStudent from './pages/RegisterStudent'
import Sessions from './pages/Sessions'
import Reports from './pages/Reports'
import Courses from './pages/Courses'
import './index.css'

// Protects dashboard routes — redirects to landing if not logged in
function PrivateRoute({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5a0', fontFamily: 'Space Mono, monospace', fontSize: 12, letterSpacing: 2 }}>
      LOADING...
    </div>
  )

  return session ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: "'Syne', sans-serif",
            fontSize: '14px'
          },
          success: { iconTheme: { primary: '#00e5a0', secondary: '#000' } },
          error:   { iconTheme: { primary: '#ff4d6d', secondary: '#fff'  } }
        }}
      />
      <Routes>
        {/* Public — landing + auth */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected — dashboard as layout with nested pages */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="attend"    element={<Layout><MarkAttendance /></Layout>} />
          <Route path="courses"   element={<Layout><Courses /></Layout>} />
          <Route path="register"  element={<Layout><RegisterStudent /></Layout>} />
          <Route path="sessions"  element={<Layout><Sessions /></Layout>} />
          <Route path="reports"   element={<Layout><Reports /></Layout>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}