import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  Mic2, Zap, Users, Download,
  CheckCircle2, ArrowRight, Globe2,
  Shield, Clock, Sparkles
} from 'lucide-react'

// Rotating Heading Component
function RotatingHeadline() {
  const words = ["understood.", "remembered.", "transcribed."]
  const [index, setIndex] = useState(0)
  const [key, setKey] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
      setKey((prev) => prev + 1)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <span className="word-rotator">
      <span key={key} className="word-rotate-in">
        {words[index]}
      </span>
    </span>
  )
}

// Typing simulator for the app preview card
function LiveTranscriptPreview() {
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [text3, setText3] = useState('')
  const [showSpk2, setShowSpk2] = useState(false)
  const [showSpk3, setShowSpk3] = useState(false)
  
  const [showTopic1, setShowTopic1] = useState(false)
  const [showTopic2, setShowTopic2] = useState(false)
  
  const [showAction1, setShowAction1] = useState(false)
  const [showAction2, setShowAction2] = useState(false)

  useEffect(() => {
    let active = true
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const runSimulation = async () => {
      while (active) {
        // Reset state
        setText1('')
        setText2('')
        setText3('')
        setShowSpk2(false)
        setShowSpk3(false)
        setShowTopic1(false)
        setShowTopic2(false)
        setShowAction1(false)
        setShowAction2(false)

        await delay(800)

        // Type Person 1 (Urdu)
        const str1 = "السلام علیکم، کیا ہم آج کی میٹنگ شروع کر سکتے ہیں؟"
        for (let i = 1; i <= str1.length; i++) {
          if (!active) return
          setText1(str1.slice(0, i))
          await delay(40)
        }

        await delay(900)
        setShowSpk2(true)

        // Type Person 2 (English)
        const str2 = "Yes, I have the Q3 report ready for review. Shall we start with the financial overview?"
        for (let i = 1; i <= str2.length; i++) {
          if (!active) return
          setText2(str2.slice(0, i))
          await delay(25)
        }

        await delay(900)
        setShowSpk3(true)

        // Type Person 1 (Urdu)
        const str3 = "جی بالکل، پہلے فنانس پھر آپریشنز۔"
        for (let i = 1; i <= str3.length; i++) {
          if (!active) return
          setText3(str3.slice(0, i))
          await delay(40)
        }

        // Show AI Minutes topics and actions
        await delay(1000)
        setShowTopic1(true)
        await delay(700)
        setShowTopic2(true)

        await delay(800)
        setShowAction1(true)
        await delay(700)
        setShowAction2(true)

        // Pause for 5 seconds at the end before looping
        await delay(5000)
      }
    }

    runSimulation()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="preview-card-container">
      {/* LEFT: Live Transcript */}
      <div className="preview-left">
        <div className="preview-header-row">
          <div className="preview-header-icon">
            <Mic2 size={15} />
            <span>Live Transcript</span>
          </div>
          <div className="preview-timer">00:14:32</div>
        </div>
        <div className="preview-transcript-log">
          {/* Speaker 1 */}
          <div className="preview-speaker-block">
            <div className="preview-speaker-name">Person 1</div>
            <div className="preview-speaker-text urdu">
              {text1}
              {text1.length < "السلام علیکم، کیا ہم آج کی میٹنگ شروع کر سکتے ہیں؟".length && <span className="typing-cursor" />}
            </div>
          </div>

          {/* Speaker 2 */}
          {showSpk2 && (
            <div className="preview-speaker-block">
              <div className="preview-speaker-name person-2">Person 2</div>
              <div className="preview-speaker-text">
                {text2}
                {text2.length < "Yes, I have the Q3 report ready for review. Shall we start with the financial overview?".length && <span className="typing-cursor" />}
              </div>
            </div>
          )}

          {/* Speaker 3 */}
          {showSpk3 && (
            <div className="preview-speaker-block">
              <div className="preview-speaker-name">Person 1</div>
              <div className="preview-speaker-text urdu">
                {text3}
                {text3.length < "جی بالکل، پہلے فنانس پھر آپریشنز۔".length && <span className="typing-cursor" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Generated Minutes */}
      <div className="preview-right">
        <div className="preview-header-row">
          <div className="preview-header-icon">
            <Sparkles size={14} fill="currentColor" />
            <span>Generated Minutes</span>
          </div>
        </div>

        <div>
          <div className="preview-section-title">Key Topics</div>
          <div style={{ minHeight: '60px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {showTopic1 && (
              <div className="preview-topic-item">
                <div className="preview-topic-check">✓</div>
                <span>Q3 Financial Review & Projections</span>
              </div>
            )}
            {showTopic2 && (
              <div className="preview-topic-item">
                <div className="preview-topic-check">✓</div>
                <span>Operational workflow optimization</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="preview-section-title">Action Items</div>
          <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {showAction1 && (
              <div className="preview-action-pill">
                <span>Update Budget Sheet</span>
                <span className="preview-action-owner person-2">Person 2</span>
              </div>
            )}
            {showAction2 && (
              <div className="preview-action-pill">
                <span>Finalize OPS Report</span>
                <span className="preview-action-owner">Person 1</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: Mic2,
    title: 'Bilingual Transcription',
    desc: 'OpenAI Whisper handles Urdu, English, and code-switching with 95%+ accuracy.',
    color: 'var(--accent)',
    bg: 'var(--accent-light)',
  },
  {
    icon: Users,
    title: 'Speaker Diarization',
    desc: 'GPT-4o identifies and labels each speaker automatically. Rename them any time.',
    color: 'var(--accent-sky)',
    bg: 'var(--accent-sky-light)',
  },
  {
    icon: Zap,
    title: 'AI Meeting Minutes',
    desc: 'Claude generates structured minutes in English or Urdu — agenda, decisions, next steps.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    icon: Download,
    title: 'Multi-format Export',
    desc: 'Export as PDF, Word DOCX, SRT subtitles, or push directly to Google Docs.',
    color: '#10b981',
    bg: '#d1fae5',
  },
]

const STEPS = [
  { n: '01', title: 'Upload Your Recording', desc: 'Drag & drop any audio or video file up to 10GB.' },
  { n: '02', title: 'AI Processes It', desc: 'OpenAI Whisper transcribes, GPT-4o identifies speakers, Claude writes the minutes.' },
  { n: '03', title: 'Review & Export', desc: 'Edit speaker names, toggle between Urdu & English, then export in any format.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handleStart = () => {
    if (user) navigate('/dashboard')
    else navigate('/auth')
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 32px', height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--accent)',
            borderRadius: 'var(--radius)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            <Mic2 size={18} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            MeetMind <span style={{ color: 'var(--accent)' }}>AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/auth')}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={handleStart} id="nav-get-started">Get Started Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" style={{ paddingBottom: 60 }}>
        <div className="beta-badge">
          <span /> Now in Beta
        </div>

        <h1 className="text-display hero-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span>Your meetings,</span>
          <RotatingHeadline />
        </h1>

        <p className="hero-subtitle" style={{ marginTop: 16 }}>
          Upload any recording. MeetMind identifies every speaker, transcribes Urdu
          and English, and delivers structured minutes with action items — ready to share.
        </p>

        <div className="hero-actions" style={{ marginBottom: 40 }}>
          <button className="btn btn-primary btn-xl" onClick={handleStart} id="hero-start">
            Get Started Free
            <ArrowRight size={18} />
          </button>
          <button
            className="btn btn-secondary btn-xl"
            onClick={() => navigate('/auth')}
            id="hero-signin"
          >
            Sign In
          </button>
        </div>

        {/* Animated Live Transcript & Minutes Preview Card */}
        <LiveTranscriptPreview />

        <div style={{ marginTop: 48, display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['No credit card required', 'Urdu & English support', 'GDPR compliant'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              <CheckCircle2 size={15} color="var(--success)" />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: 'var(--bg-secondary)', padding: '60px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="stats-row">
            {[
              { value: '95%+', label: 'Urdu Accuracy' },
              { value: '10GB', label: 'Max File Size' },
              { value: '4', label: 'Export Formats' },
              { value: '<5min', label: 'Average Processing' },
            ].map((s) => (
              <div key={s.label} className="stat-item">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 24px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="badge badge-indigo" style={{ marginBottom: 16, display: 'inline-flex' }}>
              <Zap size={12} fill="currentColor" /> Features
            </div>
            <h2 className="text-display" style={{ fontSize: 38, marginBottom: 16 }}>
              Everything your team needs
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 520, margin: '0 auto' }}>
              Built specifically for Pakistani professional and academic environments.
            </p>
          </div>
          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="feature-card">
                <div className="feature-icon" style={{ background: bg, color }}>
                  <Icon size={22} />
                </div>
                <div className="feature-title">{title}</div>
                <div className="feature-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: 'var(--bg-secondary)', padding: '80px 24px', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 className="text-display" style={{ fontSize: 38, marginBottom: 12 }}>How it works</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17 }}>Three simple steps to meeting intelligence.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, maxWidth: 860, margin: '0 auto' }}>
            {STEPS.map((step) => (
              <div key={step.n} style={{
                padding: 32, background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: 48, fontWeight: 800, color: 'var(--bg-tertiary)',
                  lineHeight: 1, marginBottom: 16, fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.04em'
                }}>
                  {step.n}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="container">
          <h2 className="text-display" style={{ fontSize: 38, marginBottom: 20 }}>
            Built for Pakistan's<br />professional world
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 540, margin: '0 auto 48px' }}>
            From FAST-NUCES seminar rooms to corporate boardrooms — MeetMind handles every accent, every mix.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            {[
              { icon: Globe2, label: 'Urdu + English', sub: 'Native code-switching' },
              { icon: Shield, label: 'Private & Secure', sub: 'Files never shared' },
              { icon: Clock, label: 'Fast Processing', sub: 'Under 5 minutes' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '24px 32px', background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
                minWidth: 180
              }}>
                <div style={{
                  width: 48, height: 48, background: 'var(--accent-light)',
                  borderRadius: 'var(--radius)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
                }}>
                  <Icon size={22} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-xl" onClick={handleStart} id="cta-bottom">
            Start Your First Meeting Free
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-primary)',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--accent)',
            borderRadius: 'var(--radius-sm)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            <Mic2 size={15} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>MeetMind AI</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          2026 all rights reserved. Made by Muhammad Bilal Asif
        </div>
      </footer>
    </div>
  )
}
