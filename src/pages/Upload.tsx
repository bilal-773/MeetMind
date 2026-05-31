import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import {
  Upload as UploadIcon, File, Video, Music,
  X, CheckCircle2, AlertCircle, ArrowRight, Info
} from 'lucide-react'
import { formatBytes } from '@/lib/utils'

const ACCEPTED_TYPES: Record<string, string[]> = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/webm': ['.webm'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/mp4': ['.m4a'],
  'audio/ogg': ['.ogg'],
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  video: <Video size={22} color="var(--accent)" />,
  audio: <Music size={22} color="var(--accent-sky)" />,
}

function getFileCategory(type: string) {
  if (type.startsWith('video')) return 'video'
  return 'audio'
}

export default function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setError('')
    if (rejected.length > 0) {
      const reason = rejected[0].errors[0]?.code === 'file-too-large'
        ? 'File exceeds 10GB limit.'
        : 'File type not supported.'
      setError(reason)
      return
    }
    if (accepted.length > 0) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 10 * 1024 * 1024 * 1024,
    multiple: false,
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size))
          setUploadProgress(percent)
        },
      })
      
      const jobData = response.data
      navigate(`/processing/${jobData.job_id}`)
    } catch (err: any) {
      console.error('Upload error:', err.response?.data || err.message)
      const detail = err.response?.data?.detail
        || err.response?.data?.error?.message
        || err.message
        || 'Failed to upload file. Please try again.'
      setError(detail)
      setUploading(false)
    }
  }

  return (
    <div className="page-content" style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="text-heading" style={{ marginBottom: 6 }}>Upload Meeting Recording</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Supports MP4, MOV, AVI, MP3, WAV, M4A, OGG, WEBM — up to 10GB.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`dropzone${isDragActive ? ' active' : ''}${isDragReject ? ' reject' : ''}`}
        id="upload-dropzone"
      >
        <input {...getInputProps()} id="upload-file-input" aria-label="Upload meeting file" />

        <div className="dropzone-icon">
          <UploadIcon size={30} />
        </div>

        {isDragActive && !isDragReject && (
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>Drop it here!</p>
        )}
        {isDragReject && (
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--error)' }}>File not supported</p>
        )}
        {!isDragActive && (
          <>
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Drop your meeting file here
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              or <span style={{ color: 'var(--accent)', fontWeight: 500, cursor: 'pointer' }}>browse files</span>
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['MP4', 'MOV', 'MP3', 'WAV', 'M4A', 'AVI', 'WEBM', 'OGG'].map((fmt) => (
                <span key={fmt} className="badge badge-gray">{fmt}</span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>Maximum file size: 10 GB</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'var(--error-light)', color: 'var(--error)',
          borderRadius: 'var(--radius)', marginTop: 12, fontSize: 13
        }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* File Preview */}
      {file && !uploading && (
        <div className="card" style={{ marginTop: 20, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, background: 'var(--accent-light)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {FORMAT_ICONS[getFileCategory(file.type)] || <File size={22} color="var(--accent)" />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
              <span>{formatBytes(file.size)}</span>
              <span>{file.type}</span>
            </div>
          </div>
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => setFile(null)}
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="card" style={{ marginTop: 20, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Uploading {file?.name}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{uploadProgress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            {uploadProgress < 100 ? 'Uploading securely…' : (
              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} /> Upload complete! Starting AI processing…
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {file && !uploading && (
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            className="btn btn-primary btn-lg"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleUpload}
            id="upload-submit"
          >
            <UploadIcon size={18} />
            Start Processing
            <ArrowRight size={18} />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => setFile(null)}>
            Cancel
          </button>
        </div>
      )}

      {/* Info Box */}
      <div style={{
        marginTop: 32, padding: 20, background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
        display: 'flex', gap: 14
      }}>
        <div style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>
          <Info size={18} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>What happens after upload?</div>
          <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Audio is extracted from your video (if applicable)',
              'OpenAI Whisper transcribes in Urdu, English, or mixed',
              'OpenAI GPT-4o identifies and separates each speaker',
              'Claude generates structured meeting minutes and extracts action items',
              'PDF, DOCX, and SRT exports are prepared',
            ].map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
