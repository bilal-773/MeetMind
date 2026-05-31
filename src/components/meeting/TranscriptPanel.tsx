import { useState } from 'react'
import { Users, Edit3, Check } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { getSpeakerColor, isRTL, formatDuration } from '@/lib/utils'
import api from '@/lib/api'
import type { Meeting } from '@/types'

interface Props { meeting: Meeting }

const allSpeakerKeys = (meeting: Meeting) =>
  [...new Set(meeting.transcript.map((s) => s.speaker))]

export default function TranscriptPanel({ meeting }: Props) {
  const { speakerNames, renameSpeaker } = useUiStore()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const speakerKeys = allSpeakerKeys(meeting)

  const getSpeakerDisplay = (key: string) =>
    speakerNames[key] ||
    meeting.speakers.find((s) => s.speakerKey === key)?.displayName ||
    key

  const startEdit = (key: string) => {
    setEditingKey(key)
    setEditValue(getSpeakerDisplay(key))
  }

  const commitEdit = async (key: string) => {
    const trimmed = editValue.trim()
    if (trimmed) {
      renameSpeaker(key, trimmed)
      try {
        await api.patch(`/meetings/${meeting.id}/speakers/${key}`, { display_name: trimmed })
      } catch (err) {
        console.error("Failed to rename speaker:", err)
      }
    }
    setEditingKey(null)
  }

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Transcript</span>
          <span className="badge badge-gray">{meeting.speakerCount} speakers</span>
        </div>
      </div>

      {/* Speaker Legend */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Speakers
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {speakerKeys.map((key, i) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: getSpeakerColor(i), flexShrink: 0
              }} />
              {editingKey === key ? (
                <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                  <input
                    className="input"
                    style={{ padding: '3px 8px', fontSize: 12, height: 28 }}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(key)
                      if (e.key === 'Escape') setEditingKey(null)
                    }}
                    autoFocus
                  />
                  <button
                    className="btn btn-icon btn-primary"
                    style={{ padding: 4, height: 28, width: 28 }}
                    onClick={() => commitEdit(key)}
                  >
                    <Check size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {getSpeakerDisplay(key)}
                  </span>
                  <button
                    className="btn btn-icon btn-ghost"
                    style={{ padding: 3 }}
                    onClick={() => startEdit(key)}
                    aria-label={`Rename ${getSpeakerDisplay(key)}`}
                  >
                    <Edit3 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transcript Segments */}
      <div className="panel-body">
        {meeting.transcript.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={22} /></div>
            <h3>No transcript</h3>
            <p>Transcript segments will appear here.</p>
          </div>
        ) : (
          meeting.transcript.map((seg, i) => {
            const speakerIndex = speakerKeys.indexOf(seg.speaker)
            const color = getSpeakerColor(speakerIndex)
            const displayName = getSpeakerDisplay(seg.speaker)
            const rtl = isRTL(seg.text)
            return (
              <div key={i} className="speaker-segment" id={`segment-${i}`}>
                <div className="speaker-bar" style={{ background: color }} />
                <div className="speaker-segment-content">
                  <div className="speaker-label">
                    <span className="speaker-name" style={{ color }}>
                      {displayName}
                    </span>
                    <span className="speaker-time">{formatDuration(seg.start)}</span>
                    {rtl && (
                      <span className="badge badge-indigo" style={{ padding: '1px 6px', fontSize: 10 }}>اردو</span>
                    )}
                  </div>
                  <p
                    className="speaker-text"
                    dir={rtl ? 'rtl' : 'ltr'}
                    style={{
                      textAlign: rtl ? 'right' : 'left',
                      fontFamily: rtl ? 'var(--font-urdu)' : undefined,
                      fontSize: rtl ? 15 : 14,
                      lineHeight: rtl ? 2.1 : 1.6,
                    }}
                  >
                    {seg.text}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
