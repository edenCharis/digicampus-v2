'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, Lock, User } from 'lucide-react'
import { login as apiLogin } from '@/lib/api'
import { ROLE_HOME } from '@/lib/permissions'
import { AppUser } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]       = useState({ login: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('dc_user')
    if (stored) {
      const u = JSON.parse(stored) as AppUser
      router.replace(ROLE_HOME[u.role] ?? '/dashboard')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const data = await apiLogin(form)
      const u = data.user as AppUser
      router.push(ROLE_HOME[u.role] ?? '/dashboard')
    } catch (err: unknown) {
      const e = err as Record<string, unknown>
      setError(typeof e?.detail === 'string' ? e.detail : 'Identifiant ou mot de passe incorrect.')
    } finally { setLoading(false) }
  }

  return (
    <main className="lp-root">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-12px) rotate(-2deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 30px rgba(239,68,68,0.2); }
          50%       { box-shadow: 0 0 50px rgba(239,68,68,0.4); }
        }

        .lp-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          background: #080F1A;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        }
        @media (max-width: 800px) {
          .lp-root { grid-template-columns: 1fr; }
          .lp-left  { display: none; }
        }

        /* ── LEFT — Brand panel ── */
        .lp-left {
          background: linear-gradient(160deg, #0B1E35 0%, #080F1A 60%, #050C16 100%);
          display: flex; flex-direction: column;
          padding: 3rem; position: relative; overflow: hidden;
          border-right: 1px solid rgba(239,68,68,0.08);
        }

        /* Background grid */
        .lp-grid {
          position: absolute; inset: 0; opacity: 0.04;
          background-image:
            linear-gradient(rgba(239,68,68,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,68,68,1) 1px, transparent 1px);
          background-size: 44px 44px;
        }

        /* Orbs */
        .lp-orb1 {
          position: absolute; width: 480px; height: 480px; border-radius: 50%;
          background: radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 65%);
          top: -120px; right: -120px; pointer-events: none;
        }
        .lp-orb2 {
          position: absolute; width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(14,51,88,0.6) 0%, transparent 70%);
          bottom: -80px; left: -80px; pointer-events: none;
        }

        .lp-brand { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; justify-content: center; }

        /* Logo */
        .lp-logo {
          display: inline-flex; align-items: center; gap: 0.875rem;
          margin-bottom: 2.5rem;
          animation: fadeUp 0.6s ease both;
        }
        .lp-monogram {
          width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
          background: linear-gradient(135deg, #0E3358, #EF4444);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.125rem; font-weight: 800; color: #fff; letter-spacing: -0.03em;
          animation: glow 3s ease infinite;
        }
        .lp-app-name { font-size: 1.375rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; line-height: 1; }
        .lp-app-name span { color: #EF4444; }
        .lp-app-sub { font-size: 0.75rem; color: #4B6A85; margin-top: 4px; font-weight: 500; letter-spacing: 0.02em; text-transform: uppercase; }

        .lp-headline {
          font-size: 2.75rem; font-weight: 800; color: #fff; line-height: 1.15;
          letter-spacing: -0.03em; margin-bottom: 1.25rem;
          animation: fadeUp 0.6s ease 0.1s both;
        }
        .lp-headline em { font-style: normal; color: #EF4444; }
        .lp-desc {
          font-size: 1rem; color: #6B8CAD; line-height: 1.65; max-width: 380px;
          margin-bottom: 3rem;
          animation: fadeUp 0.6s ease 0.2s both;
        }

        /* Feature list */
        .lp-features {
          display: flex; flex-direction: column; gap: 0.875rem;
          animation: fadeUp 0.6s ease 0.3s both;
        }
        .lp-feat {
          display: flex; align-items: center; gap: 0.875rem;
        }
        .lp-feat-icon {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem;
        }
        .lp-feat-text { font-size: 0.875rem; color: #7A9BB8; }

        /* Floating cards */
        .lp-cards {
          position: absolute; right: 2.5rem; bottom: 2.5rem; z-index: 1;
          display: flex; flex-direction: column; gap: 0.625rem;
        }
        .lp-stat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 0.75rem 1rem;
          display: flex; align-items: center; gap: 0.75rem;
          backdrop-filter: blur(10px);
        }
        .lp-stat-card:nth-child(1) { animation: float 5s ease-in-out infinite; }
        .lp-stat-card:nth-child(2) { animation: float2 6s ease-in-out infinite 1s; }
        .lp-stat-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #EF4444;
          box-shadow: 0 0 8px rgba(239,68,68,0.8); flex-shrink: 0;
        }
        .lp-stat-info { }
        .lp-stat-val { font-size: 1rem; font-weight: 700; color: #fff; line-height: 1; }
        .lp-stat-label { font-size: 0.7rem; color: #4B6A85; margin-top: 2px; }

        /* ── RIGHT — Form panel ── */
        .lp-right {
          display: flex; align-items: center; justify-content: center;
          padding: 3rem 2.5rem;
          background: #0A1525;
        }
        .lp-form-wrap {
          width: 100%; max-width: 400px;
          animation: fadeUp 0.5s ease 0.15s both;
        }

        .lp-form-header { margin-bottom: 2.25rem; }
        .lp-form-eyebrow {
          font-size: 0.7rem; font-weight: 700; color: #EF4444; letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 0.625rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .lp-form-eyebrow::before {
          content: ''; display: block; width: 20px; height: 2px;
          background: #EF4444; border-radius: 1px;
        }
        .lp-form-title {
          font-size: 1.875rem; font-weight: 800; color: #fff;
          letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 0.5rem;
        }
        .lp-form-sub { font-size: 0.875rem; color: #4B6A85; }

        .lp-err {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px; padding: 0.75rem 1rem;
          color: #fca5a5; font-size: 0.875rem; margin-bottom: 1.25rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .lp-err::before { content: '⚠'; font-size: 0.9rem; }

        .lp-fg { margin-bottom: 1.125rem; }
        .lp-label {
          display: block; font-size: 0.75rem; font-weight: 600;
          color: #5A7A96; margin-bottom: 0.5rem;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .lp-input-wrap { position: relative; }
        .lp-input-icon {
          position: absolute; left: 0.9rem; top: 50%;
          transform: translateY(-50%); color: #2E4A63; pointer-events: none;
        }
        .lp-input {
          width: 100%; padding: 0.8125rem 1rem 0.8125rem 2.75rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(200,216,232,0.1);
          border-radius: 11px; color: #fff; font-size: 0.9375rem;
          outline: none; transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .lp-input::placeholder { color: #2E4A63; }
        .lp-input:focus {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.04);
        }
        .lp-pwd-btn {
          position: absolute; right: 0.875rem; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; color: #2E4A63;
          cursor: pointer; padding: 2px; display: flex; align-items: center;
        }
        .lp-pwd-btn:hover { color: #5A7A96; }

        .lp-submit {
          width: 100%; padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #EF4444, #0E8FBF);
          color: #fff; font-size: 0.9375rem; font-weight: 700;
          border: none; border-radius: 11px; cursor: pointer;
          margin-top: 0.5rem;
          display: flex; align-items: center; justify-content: center; gap: 0.625rem;
          transition: opacity 0.2s, transform 0.1s;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 20px rgba(239,68,68,0.3);
        }
        .lp-submit:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(239,68,68,0.4); }
        .lp-submit:active:not(:disabled) { transform: translateY(0); }
        .lp-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .lp-footer {
          text-align: center; margin-top: 2.5rem;
          color: #1E3045; font-size: 0.775rem;
        }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .lp-spinner {
          width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>

      {/* ── LEFT — Brand ── */}
      <div className="lp-left">
        <div className="lp-grid" />
        <div className="lp-orb1" />
        <div className="lp-orb2" />

        <div className="lp-brand">
          <div className="lp-logo">
            <div className="lp-monogram">DC</div>
            <div>
              <div className="lp-app-name">Digital<span>Campus</span></div>
              <div className="lp-app-sub">Système de gestion académique</div>
            </div>
          </div>

          <h1 className="lp-headline">
            La gestion<br />académique<br /><em>réinventée.</em>
          </h1>
          <p className="lp-desc">
            Pilotez l'intégralité de votre établissement depuis une plateforme unifiée et sécurisée.
          </p>

          <div className="lp-features">
            {[
              { icon: '🎓', label: 'Scolarité & inscriptions en ligne' },
              { icon: '📊', label: 'Notation et délibérations' },
              { icon: '🔐', label: 'Gestion des rôles et accès' },
              { icon: '📋', label: 'Suivi pédagogique complet' },
            ].map(f => (
              <div key={f.label} className="lp-feat">
                <div className="lp-feat-icon">{f.icon}</div>
                <span className="lp-feat-text">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="lp-cards">
          <div className="lp-stat-card">
            <div className="lp-stat-dot" />
            <div className="lp-stat-info">
              <div className="lp-stat-val">14 modules</div>
              <div className="lp-stat-label">Fonctionnalités intégrées</div>
            </div>
          </div>
          <div className="lp-stat-card">
            <div className="lp-stat-dot" />
            <div className="lp-stat-info">
              <div className="lp-stat-val">Multi-rôles</div>
              <div className="lp-stat-label">Accès sécurisé par profil</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form ── */}
      <div className="lp-right">
        <div className="lp-form-wrap">
          <div className="lp-form-header">
            <div className="lp-form-eyebrow">Connexion sécurisée</div>
            <h2 className="lp-form-title">Bienvenue</h2>
            <p className="lp-form-sub">Connectez-vous avec vos identifiants.</p>
          </div>

          {error && <div className="lp-err">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="lp-fg">
              <label className="lp-label">Identifiant</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><User size={15} /></span>
                <input
                  className="lp-input"
                  type="text"
                  placeholder="Votre login"
                  value={form.login}
                  onChange={e => setForm({ ...form, login: e.target.value })}
                  required autoFocus autoComplete="username"
                />
              </div>
            </div>

            <div className="lp-fg">
              <label className="lp-label">Mot de passe</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><Lock size={15} /></span>
                <input
                  className="lp-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required autoComplete="current-password"
                />
                <button type="button" className="lp-pwd-btn" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading
                ? <><div className="lp-spinner" /> Connexion…</>
                : <>Se connecter <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="lp-footer">© {new Date().getFullYear()} DigitalCampus · DigiTech Congo</p>
        </div>
      </div>
    </main>
  )
}
