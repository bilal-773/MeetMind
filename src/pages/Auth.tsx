import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mic2, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type LoginData = z.infer<typeof loginSchema>
type SignupData = z.infer<typeof signupSchema>

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const form = useForm<LoginData | SignupData>({
    resolver: zodResolver(mode === 'login' ? loginSchema : signupSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: LoginData | SignupData) => {
    setLoading(true)
    setError('')
    console.log('Auth onSubmit started for email:', data.email)
    try {
      if (mode === 'login') {
        const { data: resData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        })
        
        console.log('SignIn Response:', { user: resData?.user, session: !!resData?.session, error: authError })
        
        if (authError) throw authError
        
        if (resData?.user && resData?.session) {
          console.log('Login successful. Saving session and redirecting to dashboard...')
          login(
            {
              id: resData.user.id,
              email: resData.user.email || '',
              displayName: resData.user.user_metadata?.display_name || resData.user.email?.split('@')[0] || 'User',
            },
            resData.session.access_token
          )
          navigate('/dashboard')
        } else {
          console.error('Session or User missing from response:', resData)
          throw new Error('Sign-in succeeded but no active session was returned. Please verify your Supabase email confirmation settings.')
        }
      } else {
        console.log('Attempting sign-up for:', data.email)
        const { data: signUpData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              display_name: ('displayName' in data && data.displayName) ? data.displayName : data.email.split('@')[0],
            }
          }
        })
        
        console.log('SignUp Response:', { user: signUpData?.user, session: !!signUpData?.session, error: authError })
        if (authError) throw authError
        
        if (signUpData?.user) {
          console.log('SignUp successful. Attempting immediate sign-in...')
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
          })
          
          console.log('Immediate SignIn Response:', { user: signInData?.user, session: !!signInData?.session, error: signInError })
          if (signInError) throw signInError
 
          if (signInData?.user && signInData?.session) {
            console.log('Immediate Login successful. Saving session...')
            login(
              {
                id: signInData.user.id,
                email: signInData.user.email || '',
                displayName: signInData.user.user_metadata?.display_name || 'User',
              },
              signInData.session.access_token
            )
            navigate('/dashboard')
          } else {
            console.error('Session missing after signup signin:', signInData)
            throw new Error('Account created but no active session was returned. Please check email confirmation.')
          }
        }
      }
    } catch (err: any) {
      console.error('Auth onSubmit caught error:', err)
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* LEFT PANEL */}
      <div className="auth-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{
              width: 38, height: 38, background: 'rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Mic2 size={20} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>MeetMind AI</span>
          </div>

          <h2 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Turn meetings<br />into action.
          </h2>
          <p style={{ fontSize: 16, opacity: 0.85, lineHeight: 1.65, maxWidth: 380, marginBottom: 40 }}>
            The only meeting intelligence platform that truly understands Urdu and English together.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Transcription in Urdu, English & mixed',
              'Automatic speaker identification',
              'AI-generated meeting minutes',
              'Export to PDF, DOCX, Google Docs',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, opacity: 0.9 }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0, opacity: 0.8 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — FORM */}
      <div className="auth-right">
        <div style={{ maxWidth: 380, width: '100%' }}>
          {/* Logo on mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
            <div style={{
              width: 32, height: 32, background: 'var(--accent)',
              borderRadius: 'var(--radius-sm)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
              <Mic2 size={16} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>MeetMind AI</span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>
            {mode === 'login' ? 'Sign in to your MeetMind account.' : 'Start transcribing smarter, today.'}
          </p>

          {/* Mode Toggle */}
          <div className="tabs" style={{ marginBottom: 28 }}>
            <button
              className={`tab${mode === 'login' ? ' active' : ''}`}
              onClick={() => { setMode('login'); form.reset(); setError('') }}
              id="auth-tab-login"
            >
              Sign In
            </button>
            <button
              className={`tab${mode === 'signup' ? ' active' : ''}`}
              onClick={() => { setMode('signup'); form.reset(); setError('') }}
              id="auth-tab-signup"
            >
              Create Account
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: 'var(--error-light)', color: 'var(--error)',
              borderRadius: 'var(--radius)', marginBottom: 20, fontSize: 13
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit as any)} noValidate>
            {mode === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <label className="label" htmlFor="displayName">Full Name</label>
                <input
                  id="displayName"
                  className="input"
                  placeholder="Ali Khan"
                  {...form.register('displayName' as any)}
                />
                {(form.formState.errors as any).displayName && (
                  <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>
                    {(form.formState.errors as any).displayName?.message}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>
                  {form.formState.errors.email.message}
                </div>
              )}
            </div>

            <div style={{ marginBottom: mode === 'signup' ? 16 : 24 }}>
              <label className="label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  style={{ paddingRight: 42 }}
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex'
                  }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.formState.errors.password && (
                <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>
                  {form.formState.errors.password.message}
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div style={{ marginBottom: 24 }}>
                <label className="label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  {...form.register('confirmPassword' as any)}
                />
                {(form.formState.errors as any).confirmPassword && (
                  <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>
                    {(form.formState.errors as any).confirmPassword?.message}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}
              disabled={loading}
              id="auth-submit"
            >
              {loading ? (
                <div className="spinner spinner-sm" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}
