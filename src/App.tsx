import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import Landing from '@/pages/Landing'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import Upload from '@/pages/Upload'
import Processing from '@/pages/Processing'
import Meeting from '@/pages/Meeting'
import AppShell from '@/components/layout/AppShell'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export default function App() {
  const { login, logout } = useAuthStore()

  useEffect(() => {
    // Listen for auth state changes from Supabase client (e.g. background token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Supabase Auth State Changed:', event)
      if (session) {
        login(
          {
            id: session.user.id,
            email: session.user.email || '',
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User',
          },
          session.access_token
        )
      } else {
        logout()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [login, logout])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      {/* Protected app routes */}
      <Route element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/processing/:jobId" element={<Processing />} />
        <Route path="/meeting/:meetingId" element={<Meeting />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
