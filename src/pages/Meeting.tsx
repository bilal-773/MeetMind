import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMeetingStore } from '@/stores/meetingStore'
import api from '@/lib/api'
import TranscriptPanel from '@/components/meeting/TranscriptPanel'
import MinutesPanel from '@/components/meeting/MinutesPanel'
import ActionItemsPanel from '@/components/meeting/ActionItemsPanel'
import SidebarInfoPanel from '@/components/meeting/SidebarInfoPanel'
import {
  ArrowLeft, Clock, Users, Globe2, Share2,
  FileText, CheckSquare, Trash2
} from 'lucide-react'
import { formatDuration } from '@/lib/utils'

export default function Meeting() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  const { setMeeting, meeting } = useMeetingStore()
  const [minutesTab, setMinutesTab] = useState<'minutes' | 'actions'>('minutes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!meetingId) return
    setLoading(true)
    setError(false)
    api.get(`/meetings/${meetingId}`)
      .then((res) => {
        setMeeting(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load meeting:", err)
        setError(true)
        setLoading(false)
      })
  }, [meetingId, setMeeting])

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this meeting? This action cannot be undone.")) {
      return
    }
    try {
      await api.delete(`/meetings/${meetingId}`)
      navigate('/dashboard')
    } catch (err) {
      console.error("Failed to delete meeting:", err)
      alert("Failed to delete meeting. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="page-content empty-state" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="spinner spinner-lg" />
        <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Loading meeting details...</p>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="page-content empty-state" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="empty-icon"><FileText size={26} /></div>
        <h3>Meeting not found</h3>
        <p>This meeting doesn't exist or you don't have access.</p>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      {/* Meeting Header */}
      <div style={{
        padding: '12px 24px', background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
      }}>
        <button className="btn btn-icon btn-ghost" onClick={() => navigate('/dashboard')} aria-label="Back to dashboard">
          <ArrowLeft size={18} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meeting.title}
          </h1>
          <div style={{ display: 'flex', gap: 14, marginTop: 2, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {formatDuration(meeting.durationSeconds)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={12} /> {meeting.speakerCount} speakers
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Globe2 size={12} /> {meeting.languagesDetected.map((l) => l.toUpperCase()).join(' + ')}
            </span>
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" id="meeting-share">
          <Share2 size={14} />
          Share
        </button>
        <button
          className="btn btn-secondary btn-sm"
          id="meeting-delete"
          style={{ borderColor: 'var(--error-light)', color: 'var(--error)' }}
          onClick={handleDelete}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      {/* 3-Panel Layout */}
      <div className="meeting-layout" style={{ flex: 1 }}>
        {/* LEFT: Transcript */}
        <TranscriptPanel meeting={meeting} />

        {/* CENTER: Minutes + Actions */}
        <div className="panel" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="panel-header">
            <div className="tabs" style={{ flex: 1 }}>
              <button
                className={`tab${minutesTab === 'minutes' ? ' active' : ''}`}
                onClick={() => setMinutesTab('minutes')}
                id="tab-minutes"
              >
                <FileText size={14} style={{ display: 'inline', marginRight: 6 }} />
                Minutes
              </button>
              <button
                className={`tab${minutesTab === 'actions' ? ' active' : ''}`}
                onClick={() => setMinutesTab('actions')}
                id="tab-actions"
              >
                <CheckSquare size={14} style={{ display: 'inline', marginRight: 6 }} />
                Action Items
                {meeting.actionItems.filter((a) => !a.isCompleted).length > 0 && (
                  <span className="badge badge-red" style={{ marginLeft: 6, padding: '1px 6px', fontSize: 11 }}>
                    {meeting.actionItems.filter((a) => !a.isCompleted).length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="panel-body">
            {minutesTab === 'minutes' ? (
              <MinutesPanel meeting={meeting} />
            ) : (
              <ActionItemsPanel meeting={meeting} />
            )}
          </div>
        </div>

        {/* RIGHT: Info + Export */}
        <SidebarInfoPanel meeting={meeting} />
      </div>
    </div>
  )
}
