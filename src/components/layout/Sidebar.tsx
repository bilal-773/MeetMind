import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Mic2,
  LogOut
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'New Meeting' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Mic2 size={20} />
        </div>
        <div>
          <div className="sidebar-logo-text">MeetMind</div>
          <div className="sidebar-logo-sub">AI</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          className="nav-item"
          style={{ cursor: 'default', marginBottom: 4, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-light)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, flexShrink: 0
          }}>
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
        <button className="nav-item" style={{ width: '100%', textAlign: 'left' }} onClick={handleLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
