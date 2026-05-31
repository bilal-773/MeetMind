import { useState } from 'react'
import { useUiStore } from '@/stores/uiStore'
import api from '@/lib/api'
import {
  Clock, Users, Globe2, Calendar, Download,
  FileText, File,
  ExternalLink,
  CheckCircle2, Loader2, Share2, Link2
} from 'lucide-react'
import { formatDuration, relativeTime } from '@/lib/utils'
import type { Meeting, ExportFormat } from '@/types'

interface Props { meeting: Meeting }

interface ExportBtn {
  format: ExportFormat
  label: string
  icon: React.ComponentType<any>
  color: string
  bg: string
}

const EXPORT_BUTTONS: ExportBtn[] = [
  { format: 'pdf',   label: 'PDF Document',    icon: FileText,   color: 'var(--error)',    bg: 'var(--error-light)' },
  { format: 'docx',  label: 'Word (.docx)',     icon: File,       color: 'var(--accent)',   bg: 'var(--accent-light)' },
  { format: 'srt',   label: 'SRT Subtitles',   icon: FileText,   color: 'var(--speaker-3)', bg: 'var(--speaker-3-bg)' },
  { format: 'gdocs', label: 'Google Docs',      icon: ExternalLink, color: 'var(--success)', bg: 'var(--success-light)' },
]

export default function SidebarInfoPanel({ meeting }: Props) {
  const { exportLoading, setExportLoading } = useUiStore()
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const [shareVisible, setShareVisible] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const handleExport = async (format: ExportFormat) => {
    setExportLoading(format, true)
    setExportSuccess(null)
    try {
      const response = await api.post(`/export/${meeting.id}/${format}`)
      const downloadUrl = response.data.download_url
      
      if (format === 'gdocs') {
        window.open(downloadUrl, '_blank')
      } else {
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `${meeting.title.replace(/\s+/g, '_')}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
      setExportSuccess(format)
    } catch (err) {
      console.error("Export failed:", err)
      window.alert("Failed to export. Please try again.")
    } finally {
      setExportLoading(format, false)
      setTimeout(() => setExportSuccess(null), 3000)
    }
  }

  const getOrCreateShareLink = async () => {
    try {
      if (shareUrl) {
        navigator.clipboard.writeText(shareUrl)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2500)
        return
      }
      
      const response = await api.post(`/share/${meeting.id}`)
      const url = response.data.share_url.replace("https://meetmind.ai", window.location.origin)
      setShareUrl(url)
      navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch (err) {
      console.error("Failed to generate share link:", err)
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span style={{ fontWeight: 600, fontSize: 14 }}>Meeting Info</span>
      </div>

      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Metadata */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            Details
          </div>
          {[
            { icon: Clock,    label: 'Duration',  value: formatDuration(meeting.durationSeconds) },
            { icon: Users,    label: 'Speakers',  value: `${meeting.speakerCount} identified` },
            { icon: Globe2,   label: 'Languages', value: meeting.languagesDetected.map((l) => l.toUpperCase()).join(' + ') },
            { icon: Calendar, label: 'Date',      value: relativeTime(meeting.createdAt) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 0', borderBottom: '1px solid var(--border)',
            }}>
              <Icon size={15} color="var(--text-muted)" />
              <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Export */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            Export
          </div>
          {EXPORT_BUTTONS.map(({ format, label, icon: Icon, color, bg }) => {
            const isLoading = exportLoading[format]
            const isSuccess = exportSuccess === format

            return (
              <button
                key={format}
                className="export-btn"
                onClick={() => handleExport(format)}
                disabled={isLoading}
                id={`export-${format}`}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                <div className="export-btn-icon" style={{ background: bg, color }}>
                  {isLoading ? (
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : isSuccess ? (
                    <CheckCircle2 size={15} color="var(--success)" />
                  ) : (
                    <Icon size={15} />
                  )}
                </div>
                <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                {isSuccess && (
                  <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 500 }}>Downloaded!</span>
                )}
                {!isLoading && !isSuccess && <Download size={14} color="var(--text-muted)" />}
              </button>
            )
          })}
        </div>

        {/* Share */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            Share
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}
            onClick={() => setShareVisible(!shareVisible)}
            id="meeting-share-link"
          >
            <Share2 size={15} />
            Create Share Link
          </button>
          {shareVisible && (
            <div style={{
              padding: 12, background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              animation: 'fadeUp 0.2s ease'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                marginBottom: 8,
              }}>
                <Link2 size={13} color="var(--text-muted)" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {shareUrl || `${window.location.origin}/shared/...`}
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={getOrCreateShareLink}
              >
                {linkCopied ? <><CheckCircle2 size={13} /> Copied!</> : <><Link2 size={13} /> Copy Link</>}
              </button>
            </div>
          )}
        </div>

        {/* Speakers */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            Speakers
          </div>
          {meeting.speakers.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{s.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
