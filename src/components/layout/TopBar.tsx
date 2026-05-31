import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, ChevronRight, Sun, Moon } from 'lucide-react'

const BREADCRUMBS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/upload': 'New Meeting',
}

export default function TopBar() {
  const location = useLocation()
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }

  const crumb = BREADCRUMBS[location.pathname] ||
    (location.pathname.startsWith('/meeting') ? 'Meeting View' : 
     location.pathname.startsWith('/processing') ? 'Processing' : 'MeetMind')

  return (
    <header className="topbar">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>MeetMind</span>
        <ChevronRight size={14} color="var(--text-muted)" />
        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{crumb}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn btn-icon btn-ghost"
          onClick={toggleTheme}
          id="topbar-theme-toggle"
          aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="btn btn-icon btn-ghost" id="topbar-notifications" aria-label="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
