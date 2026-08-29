'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, GraduationCap, Lock, User } from 'lucide-react'
import { login as apiLogin } from '@/lib/api'
import { ROLE_HOME } from '@/lib/utils'
import { AppUser } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ login: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    const stored = localStorage.getItem('dc_user')
    if (stored) {
      const u = JSON.parse(stored) as AppUser
      router.replace(ROLE_HOME[u.role] ?? '/dashboard')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await apiLogin(form)
      const u = data.user as AppUser
      router.push(ROLE_HOME[u.role] ?? '/dashboard')
    } catch (err: unknown) {
      const e = err as Record<string, unknown>
      setError(
        typeof e?.detail === 'string'
          ? e.detail
          : 'Identifiant ou mot de passe incorrect.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-root">
      <style>{`
        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #081A2E;
        }
        @media (max-width: 768px) {
          .login-root { grid-template-columns: 1fr; }
          .login-brand { display: none; }
        }
        .login-brand {
          background: linear-gradient(180deg, #0E3358 0%, #081A2E 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          border-right: 1px solid rgba(26, 175, 230, 0.2);
          position: relative;
          overflow: hidden;
        }
        .login-brand::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(26,175,230,0.12) 0%, transparent 70%);
          top: -80px;
          right: -80px;
        }
        .login-brand::after {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(26,175,230,0.08) 0%, transparent 70%);
          bottom: -60px;
          left: -60px;
        }
        .brand-logo {
          width: 80px;
          height: 80px;
          background: rgba(26, 175, 230, 0.15);
          border: 2px solid rgba(26, 175, 230, 0.4);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }
        .brand-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.5rem;
          text-align: center;
          letter-spacing: -0.02em;
          position: relative;
          z-index: 1;
        }
        .brand-title span {
          color: #1AAFE6;
        }
        .brand-subtitle {
          color: #C8D8E8;
          font-size: 1rem;
          text-align: center;
          max-width: 320px;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }
        .brand-features {
          margin-top: 3rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          max-width: 320px;
          position: relative;
          z-index: 1;
        }
        .brand-feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #90B4CC;
          font-size: 0.875rem;
        }
        .brand-feature-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1AAFE6;
          flex-shrink: 0;
        }
        .login-form-side {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          background: #0a1929;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
        }
        .login-heading {
          font-size: 1.75rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem;
        }
        .login-desc {
          color: #90B4CC;
          margin: 0 0 2rem;
          font-size: 0.9rem;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #C8D8E8;
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: #4a6a8a;
          pointer-events: none;
        }
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(200,216,232,0.15);
          border-radius: 10px;
          color: #ffffff;
          font-size: 0.9375rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .form-input::placeholder { color: #4a6a8a; }
        .form-input:focus {
          border-color: #1AAFE6;
          background: rgba(26, 175, 230, 0.06);
        }
        .pwd-toggle {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #4a6a8a;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .pwd-toggle:hover { color: #90B4CC; }
        .error-box {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: #fca5a5;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
        }
        .btn-login {
          width: 100%;
          padding: 0.875rem;
          background: #1AAFE6;
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          margin-top: 0.5rem;
          letter-spacing: 0.01em;
        }
        .btn-login:hover:not(:disabled) {
          background: #1490c2;
        }
        .btn-login:active:not(:disabled) {
          transform: scale(0.99);
        }
        .btn-login:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-footer {
          text-align: center;
          margin-top: 2rem;
          color: #4a6a8a;
          font-size: 0.8rem;
        }
      `}</style>

      {/* Brand side */}
      <div className="login-brand">
        <div className="brand-logo">
          <GraduationCap size={40} color="#1AAFE6" />
        </div>
        <h1 className="brand-title">
          Digital<span>Campus</span>
        </h1>
        <p className="brand-subtitle">
          Plateforme intégrée de gestion académique pour les établissements d&apos;enseignement supérieur
        </p>
        <div className="brand-features">
          {[
            'Gestion multi-établissements',
            'Scolarité & inscriptions',
            'Notation & délibérations',
            'Suivi pédagogique complet',
            'Tableaux de bord en temps réel',
          ].map((f) => (
            <div key={f} className="brand-feature">
              <div className="brand-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="login-form-side">
        <div className="login-card">
          <h2 className="login-heading">Connexion</h2>
          <p className="login-desc">Accédez à votre espace de gestion académique</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Identifiant</label>
              <div className="input-wrapper">
                <span className="input-icon"><User size={16} /></span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Votre login"
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label="Afficher/masquer le mot de passe"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </button>
          </form>

          <p className="login-footer">
            © {new Date().getFullYear()} DigitalCampus — DigiTech
          </p>
        </div>
      </div>
    </main>
  )
}
