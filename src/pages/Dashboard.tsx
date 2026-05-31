import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { formatDuration, relativeTime } from '@/lib/utils'
import {
  Plus, Mic2, Clock, Users, Globe2,
  ArrowRight, Loader2, CheckCircle2, Trash2
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [meetings, setMeetings] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const meetRes = await api.get('/meetings')
        setMeetings(meetRes.data)

        const activeJobsRes = await api.get('/jobs/active')
        const activeJobs = activeJobsRes.data
        if (activeJobs) {
          const mappedJobs = activeJobs.map((j: any) => ({
            id: j.id,
            status: j.status,
            step: j.step,
            progressPct: j.progress_pct,
            fileName: j.file_name,
            fileSizeBytes: j.file_size_bytes,
            createdAt: j.created_at
          }))
          setJobs(mappedJobs)
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const timer = setInterval(fetchData, 5000)
    return () => clearInterval(timer)
  }, [user])

  const handleDelete = async (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (deletingId) return
    if (!window.confirm("Are you sure you want to delete this meeting? This action cannot be undone.")) {
      return
    }
    
    // Store current list in case we need to roll back
    const previousMeetings = [...meetings]
    
    // Optimistic Update: remove meeting instantly from UI
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId))
    
    setDeletingId(meetingId)
    try {
      await api.delete(`/meetings/${meetingId}`)
    } catch (err) {
      console.error("Failed to delete meeting:", err)
      alert("Failed to delete meeting. Please try again.")
      // Rollback optimistic update
      setMeetings(previousMeetings)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading && meetings.length === 0) {
    return (
      <div className="page-content empty-state" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="spinner spinner-lg" />
        <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="text-heading">
            Good afternoon, {user?.displayName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Here's your meeting intelligence overview.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Meetings', value: meetings.length, icon: Mic2, color: 'var(--accent)', bg: 'var(--accent-light)' },
          { label: 'Hours Transcribed', value: `${(meetings.reduce((a, m) => a + (m.durationSeconds || 0), 0) / 3600).toFixed(1)}h`, icon: Clock, color: 'var(--accent-sky)', bg: 'var(--accent-sky-light)' },
          { label: 'Action Items', value: meetings.reduce((a, m) => a + (m.actionItems?.length || 0), 0), icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-light)' },
          { label: 'Languages', value: 'EN + UR', icon: Globe2, color: '#8b5cf6', bg: '#f5f3ff' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: 36, height: 36, background: bg, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                <Icon size={18} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Meetings List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="text-subheading">Recent Meetings</h2>
            <span className="badge badge-gray">{meetings.length} meetings</span>
          </div>

          {meetings.map((m) => (
            <div
              key={m.id}
              className="meeting-row"
              onClick={() => navigate(`/meeting/${m.id}`)}
              id={`meeting-row-${m.id}`}
            >
              <div className="meeting-icon">
                <Mic2 size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.title}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> {formatDuration(m.durationSeconds)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={11} /> {m.speakerCount} speakers
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Globe2 size={11} /> {m.languagesDetected.join(', ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{relativeTime(m.createdAt)}</span>
                <span className="badge badge-green">
                  <CheckCircle2 size={11} /> Ready
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn-icon btn-ghost"
                  onClick={(e) => handleDelete(e, m.id)}
                  disabled={deletingId === m.id}
                  style={{
                    color: 'var(--error)',
                    padding: '6px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: deletingId === m.id ? 0.5 : 1
                  }}
                  title="Delete Meeting"
                  id={`delete-btn-${m.id}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>
          ))}

          {meetings.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon"><Mic2 size={26} /></div>
              <h3>No meetings yet</h3>
              <p>Upload your first meeting recording to get started.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/upload')}>
                <Plus size={14} /> Upload Meeting
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: Processing + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Processing Jobs */}
          {jobs.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Loader2 size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Processing</span>
                <span className="badge badge-amber">{jobs.length}</span>
              </div>
              {jobs.map((j) => (
                <div
                  key={j.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/processing/${j.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {j.fileName}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginLeft: 8 }}>
                      {j.progressPct}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${j.progressPct}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, textTransform: 'capitalize' }}>
                    {j.step?.replace('_', ' ')}…
                  </div>
                </div>
              ))}
            </div>
          )}



          {/* Tip */}
          <div style={{
            padding: 16, background: 'var(--accent-light)', borderRadius: 'var(--radius)',
            border: '1px solid var(--accent-muted)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>💡 Pro Tip</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Use the Theme Toggle in the top navigation bar to switch between Light and Dark modes on the fly.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
