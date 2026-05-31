import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '@/lib/api'
import {
  CheckCircle2, Loader2, Clock, Mic2,
  Users, FileText, ArrowRight
} from 'lucide-react'

interface PipelineStep {
  id: string
  label: string
  description: string
  detail?: string
}

const STEPS: PipelineStep[] = [
  { id: 'uploaded',           label: 'File Uploaded',          description: 'Your recording was received.' },
  { id: 'converting',         label: 'Converting Audio',        description: 'Extracting audio with FFmpeg.' },
  { id: 'transcribing',       label: 'Transcribing',           description: 'OpenAI Whisper is running…', detail: 'Urdu + English detected' },
  { id: 'diarizing',          label: 'Identifying Speakers',   description: 'GPT-4o is detecting speakers…', detail: '3 speakers found' },
  { id: 'generating_minutes', label: 'Generating Minutes',     description: 'Claude is writing meeting minutes…' },
  { id: 'extracting_actions', label: 'Extracting Action Items',description: 'Claude is finding tasks and owners…' },
  { id: 'preparing_exports',  label: 'Preparing Exports',      description: 'Building PDF, DOCX, and SRT files…' },
]

export default function Processing() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [meetingId, setMeetingId] = useState('')

  // Count elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Poll job status
  useEffect(() => {
    if (!jobId) return

    let isSubscribed = true
    const poll = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`)
        const job = response.data
        if (!isSubscribed) return

        if (job.status === 'completed') {
          setMeetingId(job.meeting_id || '')
          setCurrentStep(STEPS.length - 1)
          setDone(true)
        } else if (job.status === 'failed') {
          setError(job.error_message || 'An error occurred during AI processing.')
        } else {
          const stepIdx = STEPS.findIndex((s) => s.id === job.step)
          if (stepIdx !== -1) {
            setCurrentStep(stepIdx)
          }
        }
      } catch (err: any) {
        if (!isSubscribed) return
        setError(err.response?.data?.detail || 'Failed to fetch job status.')
      }
    }

    poll()
    const timer = setInterval(poll, 3000)

    return () => {
      isSubscribed = false
      clearInterval(timer)
    }
  }, [jobId])

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  if (error) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{
            width: 80, height: 80, background: 'var(--error-light)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px', color: 'var(--error)',
            animation: 'fadeUp 0.4s ease'
          }}>
            <CheckCircle2 size={40} style={{ transform: 'rotate(135deg)', color: 'var(--error)' }} />
          </div>
          <h1 className="text-heading" style={{ marginBottom: 10, color: 'var(--error)' }}>
            Processing Failed
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32 }}>
            {error}
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/dashboard')}
            style={{ margin: '0 auto' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{
            width: 80, height: 80, background: 'var(--success-light)',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px', color: 'var(--success)',
            animation: 'fadeUp 0.4s ease'
          }}>
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-heading" style={{ marginBottom: 10, animation: 'fadeUp 0.5s ease' }}>
            Meeting Ready! 🎉
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32, animation: 'fadeUp 0.6s ease' }}>
            Your meeting has been fully processed. Transcript, minutes, and action items are ready to review.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeUp 0.7s ease' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate(`/meeting/${meetingId}`)}
              id="processing-view-meeting"
            >
              View Meeting
              <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content" style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px',
          background: 'var(--warning-light)', color: 'var(--warning)',
          borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 500, marginBottom: 16
        }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Processing in progress
        </div>
        <h1 className="text-heading" style={{ marginBottom: 8 }}>AI is analysing your meeting</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          board_meeting_may.mp4 &nbsp;·&nbsp; Est. 3–5 minutes
        </p>
      </div>

      {/* Status Card */}
      <div className="card-elevated" style={{ padding: '28px 32px', marginBottom: 24 }}>
        {/* Overall Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Overall Progress</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
              {Math.round((currentStep / (STEPS.length - 1)) * 100)}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div
              className="progress-fill"
              style={{ width: `${Math.round((currentStep / (STEPS.length - 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Pipeline Steps */}
        {STEPS.map((step, i) => {
          const status = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'
          return (
            <div key={step.id} className={`pipeline-step ${status}`}>
              <div className={`step-icon ${status}`}>
                {status === 'done' && <CheckCircle2 size={16} />}
                {status === 'active' && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                {status === 'pending' && <span>{i + 1}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div className="step-label" style={{ opacity: status === 'pending' ? 0.45 : 1 }}>
                  {step.label}
                </div>
                {status !== 'pending' && (
                  <div className="step-desc">{step.description}</div>
                )}
                {status !== 'pending' && step.detail && (
                  <div className="step-time" style={{ color: 'var(--success)', fontFamily: 'inherit', fontSize: 12 }}>
                    ✓ {step.detail}
                  </div>
                )}
                {status === 'done' && (
                  <div className="step-time">Completed</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div style={{
        display: 'flex', gap: 20, flexWrap: 'wrap',
        padding: '16px 20px', background: 'var(--bg-primary)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Clock size={14} /> Elapsed: <strong style={{ color: 'var(--text-primary)' }}>{formatElapsed(elapsed)}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Mic2 size={14} /> OpenAI Whisper
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <Users size={14} /> GPT-4o Diarizer
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          <FileText size={14} /> Claude claude-sonnet
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
        You can safely close this tab. We'll process in the background.
      </p>
    </div>
  )
}
