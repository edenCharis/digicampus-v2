'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen, Bell, Lock } from 'lucide-react'
import Sidebar from './Sidebar'
import { AppUser } from '@/types'
import { ROLE_LABELS } from '@/lib/utils'
import { ROLE_HOME, canAccess } from '@/lib/permissions'
import { logout as apiLogout, clearTokens } from '@/lib/api'

const MODULE_LABELS: Record<string, string> = {
  '/administrateur': 'Administration',
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

  useEffect(() => {
    const stored = localStorage.getItem('dc_user')
    if (!stored) { router.replace('/login'); return }
    const u: AppUser = JSON.parse(stored)
    setUser(u)
    setDenied(!canAccess(u.role, pathname))

    const saved = localStorage.getItem('dc_sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [router, pathname])

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
    <div style={{ minHeight: '100vh', background: '#F0F4F8' }}>
      <style>{`
        /* ── Topbar ── */
        .dc-topbar {
          height: 56px;
          background: #fff;
          border-bottom: 1px solid #E4EAF0;
          display: flex; align-items: center;
          padding: 0 1.25rem; gap: 0.875rem;
          position: fixed; top: 0; z-index: 30;
          right: 0;
          left: ${sidebarW}px;
          transition: left 0.22s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 1px 0 rgba(14,51,88,0.04), 0 2px 8px rgba(14,51,88,0.03);
        }
        @media (max-width: 1023px) { .dc-topbar { left: 0 !important; } }

        /* ── Toggle button ── */
        .dc-toggle {
          background: none; border: none; cursor: pointer;
          color: #94a3b8; padding: 7px; border-radius: 9px;
          display: flex; align-items: center;
          transition: background 0.15s, color 0.15s; flex-shrink: 0;
        }
        .dc-toggle:hover { background: #F0F4F8; color: #0E3358; }

        /* ── Separator ── */
        .dc-sep {
          width: 1px; height: 20px; background: #E4EAF0; flex-shrink: 0;
        }

        /* ── Breadcrumb ── */
        .dc-breadcrumb {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; overflow: hidden;
        }
        .dc-brand-crumb {
          color: #94a3b8; font-size: 0.8125rem; white-space: nowrap;
          font-weight: 500;
        }
        .dc-crumb-sep { color: #CBD5E1; font-size: 0.8rem; }
        .dc-module-name {
          font-weight: 700; color: #0D1B2E; font-size: 0.9rem;
          letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ── Right side ── */
        .dc-topbar-right {
          margin-left: auto; display: flex; align-items: center; gap: 0.625rem; flex-shrink: 0;
        }
        .dc-bell {
          position: relative; background: none; border: none;
          color: #94a3b8; cursor: pointer; padding: 8px; border-radius: 9px;
          display: flex; align-items: center; transition: all 0.15s;
        }
        .dc-bell:hover { background: #F0F4F8; color: #0E3358; }

        .dc-user-pill {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 4px 10px 4px 4px;
          border-radius: 24px;
          background: #F0F4F8;
          border: 1px solid #E4EAF0;
        }
        .dc-user-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #0E3358 0%, #1AAFE6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.68rem; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .dc-user-name { font-size: 0.8rem; font-weight: 600; color: #1e293b; }
        .dc-role-badge {
          font-size: 0.62rem; font-weight: 700; color: #1AAFE6;
          background: rgba(26,175,230,0.1); border-radius: 20px;
          padding: 0.1rem 0.45rem; text-transform: uppercase; letter-spacing: 0.05em;
        }
        @media (max-width: 580px) { .dc-user-name, .dc-role-badge { display: none; } }

        /* ── Content ── */
        .dc-content {
          margin-left: ${sidebarW}px;
          padding-top: 56px; min-height: 100vh;
          transition: margin-left 0.22s cubic-bezier(.4,0,.2,1);
        }
        @media (max-width: 1023px) { .dc-content { margin-left: 0 !important; } }

        .dc-page { padding: 1.5rem 1.75rem; }
        @media (max-width: 640px) { .dc-page { padding: 1rem; } }

        /* ── Access denied ── */
        .dc-denied {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 60vh; text-align: center; gap: 1rem;
        }
        .dc-denied-icon {
          width: 72px; height: 72px; border-radius: 20px;
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15);
          display: flex; align-items: center; justify-content: center;
        }
        .dc-denied h2 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0; }
        .dc-denied p { font-size: 0.875rem; color: #64748b; margin: 0; max-width: 320px; line-height: 1.6; }
        .dc-denied-btn {
          padding: 0.55rem 1.5rem; background: #1AAFE6; color: #fff; border: none;
          border-radius: 9px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .dc-denied-btn:hover { background: #1490c2; }
      `}</style>

      <Sidebar
        role={user.role}
        nom={user.nom}
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
            <div className="dc-user-pill">
              <div className="dc-user-avatar">
                {(user.nom || user.login)[0].toUpperCase()}
              </div>
              <span className="dc-user-name">{user.nom || user.login}</span>
              <span className="dc-role-badge">{ROLE_LABELS[user.role] ?? user.role}</span>
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
