'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { PanelLeftClose, PanelLeftOpen, Bell, Lock, User, LogOut, ChevronDown } from 'lucide-react'
import Sidebar from './Sidebar'
import { AppUser } from '@/types'
import { ROLE_LABELS } from '@/lib/utils'
import { ROLE_HOME, canAccess } from '@/lib/permissions'
import { logout as apiLogout, clearTokens } from '@/lib/api'

const MODULE_LABELS: Record<string, string> = {
  '/administrateur/universites':    'Universités',
  '/administrateur/etablissements': 'Établissements',
  '/administrateur/comptes':        'Comptes',
  '/administrateur/abonnements':    'Abonnements',
  '/administrateur/logs':           'Logs d\'activité',
  '/administrateur/parametrage':    'Paramétrage',
  '/administrateur':                'Tableau de bord',
  '/compte':         'Mon compte',
  '/scolarite':      'Scolarité',
  '/doyen':          'Doyen',
  '/enseignant':     'Enseignants',
  '/professeur':     'Professeurs',
  '/cours':          'Cours',
  '/inscription':    'Inscriptions',
  '/anonymat':       'Anonymat',
  '/daarhspe':       'DAARHSPE',
  '/gesnote':        'Gestion des notes',
  '/soutenance':     'Soutenance',
  '/suivi':          'Suivi',
  '/caisse':         'Caisse',
  '/pvd':            'PVD',
}

function getModuleLabel(pathname: string) {
  const match = Object.keys(MODULE_LABELS)
    .filter(p => pathname === p || pathname.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length)[0]
  return match ? MODULE_LABELS[match] : 'Tableau de bord'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]                   = useState<AppUser | null>(null)
  const [mobileOpen, setMobileOpen]       = useState(false)
  const [collapsed, setCollapsed]         = useState(false)
  const [denied, setDenied]               = useState(false)
  const [profileOpen, setProfileOpen]     = useState(false)
  const profileRef                        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('dc_user')
    if (!stored) { router.replace('/login'); return }
    const u: AppUser = JSON.parse(stored)
    setUser(u)
    setDenied(!canAccess(u.role, pathname))

    const saved = localStorage.getItem('dc_sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [router, pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('dc_sidebar_collapsed', String(next))
  }

  async function handleLogout() {
    const tokens = localStorage.getItem('dc_tokens')
    const refresh = tokens ? JSON.parse(tokens).refresh : null
    if (refresh) await apiLogout(refresh)
    else clearTokens()
    router.push('/login')
  }

  if (!user) return null

  const moduleLabel = getModuleLabel(pathname)
  const sidebarW = collapsed ? 72 : 256

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { overflow-x: hidden; }

        /* ── Topbar ── */
        .dc-topbar {
          height: 56px;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          display: flex; align-items: center;
          padding: 0 1.5rem; gap: 1rem;
          position: fixed; top: 0; z-index: 30;
          right: 0;
          left: ${sidebarW}px;
          transition: left 0.22s cubic-bezier(.4,0,.2,1);
        }
        @media (max-width: 1023px) { .dc-topbar { left: 0 !important; } }

        .dc-toggle {
          background: none; border: none; cursor: pointer;
          color: #cbd5e1; padding: 6px; border-radius: 8px;
          display: flex; align-items: center;
          transition: background 0.15s, color 0.15s; flex-shrink: 0;
        }
        .dc-toggle:hover { background: #f8fafc; color: #334155; }

        .dc-sep { width: 1px; height: 18px; background: #f1f5f9; flex-shrink: 0; }

        .dc-breadcrumb {
          display: flex; align-items: center; gap: 0.375rem;
          font-size: 0.875rem; overflow: hidden; min-width: 0;
        }
        .dc-brand-crumb { color: #cbd5e1; font-size: 0.8rem; white-space: nowrap; font-weight: 500; }
        .dc-crumb-sep { color: #e2e8f0; font-size: 0.75rem; }
        .dc-module-name {
          font-weight: 600; color: #0f172a; font-size: 0.875rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .dc-topbar-right {
          margin-left: auto; display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;
        }
        .dc-bell {
          background: none; border: none; color: #cbd5e1; cursor: pointer;
          padding: 7px; border-radius: 8px; display: flex; align-items: center;
          transition: all 0.15s;
        }
        .dc-bell:hover { background: #f8fafc; color: #475569; }

        .dc-profile-wrap { position: relative; }
        .dc-user-pill {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 3px 8px 3px 3px; border-radius: 24px;
          background: #f8fafc; border: 1px solid #f1f5f9;
          cursor: pointer; transition: background 0.15s, border-color 0.15s;
        }
        .dc-user-pill:hover { background: #f1f5f9; border-color: #e2e8f0; }
        .dc-user-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #0E3358 0%, #1AAFE6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.68rem; font-weight: 700; color: #fff; flex-shrink: 0;
          overflow: hidden; object-fit: cover;
        }
        .dc-user-name { font-size: 0.8rem; font-weight: 600; color: #1e293b; }
        .dc-role-badge {
          font-size: 0.6rem; font-weight: 700; color: #1AAFE6;
          background: rgba(26,175,230,0.08); border-radius: 20px;
          padding: 0.1rem 0.5rem; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .dc-chevron { color: #cbd5e1; transition: transform 0.2s; }
        .dc-chevron.open { transform: rotate(180deg); }
        @media (max-width: 580px) { .dc-user-name, .dc-role-badge { display: none; } }

        /* Profile dropdown */
        .dc-profile-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0;
          background: #fff; border: 1px solid #f1f5f9;
          border-radius: 12px; box-shadow: 0 8px 24px rgba(15,23,42,0.1), 0 2px 6px rgba(15,23,42,0.05);
          min-width: 200px; overflow: hidden; z-index: 100;
          animation: dropIn 0.15s ease;
        }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .dc-profile-header {
          padding: 0.875rem 1rem 0.75rem;
          border-bottom: 1px solid #f8fafc;
        }
        .dc-profile-name { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
        .dc-profile-role { font-size: 0.7rem; color: #94a3b8; margin-top: 2px; }
        .dc-profile-item {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.625rem 1rem; font-size: 0.8125rem; font-weight: 500;
          color: #475569; text-decoration: none; cursor: pointer;
          transition: background 0.12s; background: none; border: none; width: 100%; text-align: left;
        }
        .dc-profile-item:hover { background: #f8fafc; color: #0f172a; }
        .dc-profile-item.danger:hover { background: rgba(239,68,68,0.05); color: #ef4444; }
        .dc-profile-divider { height: 1px; background: #f8fafc; margin: 2px 0; }

        /* ── Content ── */
        .dc-content {
          margin-left: ${sidebarW}px;
          padding-top: 56px;
          min-height: 100vh;
          background: #fff;
          transition: margin-left 0.22s cubic-bezier(.4,0,.2,1);
        }
        @media (max-width: 1023px) { .dc-content { margin-left: 0 !important; } }

        .dc-page { padding: 2rem 2rem; max-width: 100%; overflow-x: hidden; }
        @media (max-width: 768px) { .dc-page { padding: 1.25rem 1rem; } }

        /* ── Access denied ── */
        .dc-denied {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 60vh; text-align: center; gap: 1rem;
        }
        .dc-denied-icon {
          width: 64px; height: 64px; border-radius: 18px;
          background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.12);
          display: flex; align-items: center; justify-content: center;
        }
        .dc-denied h2 { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0; }
        .dc-denied p { font-size: 0.875rem; color: #64748b; margin: 0; max-width: 300px; line-height: 1.6; }
        .dc-denied-btn {
          padding: 0.5rem 1.5rem; background: #1AAFE6; color: #fff; border: none;
          border-radius: 9px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .dc-denied-btn:hover { background: #1490c2; }
      `}</style>

      <Sidebar
        role={user.role}
        nom={user.nom}
        photo={user.photo}
        etablissement={user.etablissement_name ?? undefined}
        onLogout={handleLogout}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
      />

      <div className="dc-content">
        <header className="dc-topbar">
          {/* Toggle — desktop collapses sidebar, mobile opens it */}
          <button className="dc-toggle"
            onClick={() => {
              if (window.innerWidth >= 1024) toggleCollapse()
              else setMobileOpen(v => !v)
            }}
            aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
          >
            {collapsed
              ? <PanelLeftOpen size={19} />
              : <PanelLeftClose size={19} />
            }
          </button>

          <div className="dc-sep" />

          <div className="dc-breadcrumb">
            <span className="dc-brand-crumb">Digital Campus</span>
            <span className="dc-crumb-sep">/</span>
            <span className="dc-module-name">{moduleLabel}</span>
          </div>

          <div className="dc-topbar-right">
            <button className="dc-bell" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <div className="dc-profile-wrap" ref={profileRef}>
              <div className="dc-user-pill" onClick={() => setProfileOpen(v => !v)}>
                <div className="dc-user-avatar">
                  {user.photo
                    ? <img src={user.photo.startsWith('http') ? user.photo : `${(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace('/api', '')}${user.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : (user.nom || user.login)[0].toUpperCase()
                  }
                </div>
                <span className="dc-user-name">{user.nom || user.login}</span>
                <span className="dc-role-badge">{ROLE_LABELS[user.role] ?? user.role}</span>
                <ChevronDown size={13} className={`dc-chevron${profileOpen ? ' open' : ''}`} />
              </div>
              {profileOpen && (
                <div className="dc-profile-dropdown">
                  <div className="dc-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0E3358,#1AAFE6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                      {user.photo
                        ? <img src={user.photo.startsWith('http') ? user.photo : `${(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace('/api', '')}${user.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (user.nom || user.login)[0].toUpperCase()
                      }
                    </div>
                    <div>
                      <div className="dc-profile-name">{user.nom || user.login}</div>
                      <div className="dc-profile-role">{ROLE_LABELS[user.role] ?? user.role} · {user.etablissement_name ?? 'Digital Campus'}</div>
                    </div>
                  </div>
                  <Link href="/compte" className="dc-profile-item" onClick={() => setProfileOpen(false)}>
                    <User size={15} /> Mon compte
                  </Link>
                  <div className="dc-profile-divider" />
                  <button className="dc-profile-item danger" onClick={() => { setProfileOpen(false); handleLogout() }}>
                    <LogOut size={15} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dc-page">
          {denied ? (
            <div className="dc-denied">
              <div className="dc-denied-icon">
                <Lock size={28} color="#ef4444" />
              </div>
              <h2>Accès restreint</h2>
              <p>
                Vous n&apos;avez pas les permissions pour accéder à cette section.
                <br />Rôle actuel : <strong style={{ color: '#1AAFE6' }}>{ROLE_LABELS[user.role]}</strong>
              </p>
              <button className="dc-denied-btn" onClick={() => router.push(ROLE_HOME[user.role] ?? '/')}>
                Retour à mon espace
              </button>
            </div>
          ) : children}
        </main>
      </div>
    </div>
  )
}
