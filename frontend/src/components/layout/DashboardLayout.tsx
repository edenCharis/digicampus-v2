'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Bell, Lock } from 'lucide-react'
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
  const [user, setUser]               = useState<AppUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [denied, setDenied]           = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('dc_user')
    if (!stored) { router.replace('/login'); return }
    const u: AppUser = JSON.parse(stored)
    setUser(u)
    setDenied(!canAccess(u.role, pathname))
  }, [router, pathname])

  async function handleLogout() {
    const tokens = localStorage.getItem('dc_tokens')
    const refresh = tokens ? JSON.parse(tokens).refresh : null
    if (refresh) await apiLogout(refresh)
    else clearTokens()
    router.push('/login')
  }

  if (!user) return null

  const moduleLabel = getModuleLabel(pathname)

  return (
    <div style={{ minHeight: '100vh', background: '#F2F5F9' }}>
      <style>{`
        /* ── topbar ── */
        .dc-topbar {
          height: 58px;
          background: #fff;
          border-bottom: 1px solid #E8EDF3;
          display: flex; align-items: center;
          padding: 0 1.5rem; gap: 1rem;
          position: fixed; top: 0; left: 256px; right: 0; z-index: 30;
          box-shadow: 0 1px 3px rgba(14,51,88,0.06);
        }
        @media (max-width: 1023px) { .dc-topbar { left: 0; } .dc-content { margin-left: 0 !important; } }

        .dc-hamburger {
          background: none; border: none; color: #64748b; cursor: pointer;
          padding: 7px; border-radius: 8px; display: none; align-items: center;
        }
        @media (max-width: 1023px) { .dc-hamburger { display: flex; } }
        .dc-hamburger:hover { background: #F2F5F9; color: #0E3358; }

        .dc-breadcrumb {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.875rem; color: #64748b;
        }
        .dc-module-name {
          font-weight: 700; color: #0E3358; font-size: 0.9375rem; letter-spacing: -0.01em;
        }

        .dc-topbar-right {
          margin-left: auto; display: flex; align-items: center; gap: 0.5rem;
        }
        .dc-bell {
          position: relative; background: none; border: none;
          color: #94a3b8; cursor: pointer; padding: 8px; border-radius: 9px;
          display: flex; align-items: center; transition: all 0.15s;
        }
        .dc-bell:hover { background: #F2F5F9; color: #0E3358; }

        .dc-user-pill {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 5px 10px 5px 5px;
          border-radius: 24px;
          background: #F2F5F9;
          border: 1px solid #E8EDF3;
          cursor: default;
        }
        .dc-user-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #0E3358 0%, #1AAFE6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .dc-user-name { font-size: 0.8125rem; font-weight: 600; color: #1e293b; }
        .dc-user-role-badge {
          font-size: 0.65rem; font-weight: 700; color: #1AAFE6;
          background: rgba(26,175,230,0.1); border-radius: 20px;
          padding: 0.1rem 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;
        }
        @media (max-width: 480px) { .dc-user-name { display: none; } .dc-user-role-badge { display: none; } }

        /* ── content ── */
        .dc-content { margin-left: 256px; padding-top: 58px; min-height: 100vh; }
        .dc-page { padding: 1.75rem; }

        /* ── access denied ── */
        .dc-denied {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 60vh; text-align: center; gap: 1rem;
        }
        .dc-denied-icon {
          width: 72px; height: 72px; border-radius: 20px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .dc-denied h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; }
        .dc-denied p { font-size: 0.875rem; color: #64748b; margin: 0; max-width: 320px; }
        .dc-denied-btn {
          padding: 0.55rem 1.5rem; background: #1AAFE6; color: #fff; border: none;
          border-radius: 9px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
          margin-top: 0.25rem; transition: background 0.15s;
        }
        .dc-denied-btn:hover { background: #1490c2; }
      `}</style>

      <Sidebar
        role={user.role}
        nom={user.nom}
        etablissement={user.etablissement_name ?? user.university_name ?? undefined}
        onLogout={handleLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dc-content">
        <header className="dc-topbar">
          <button className="dc-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <Menu size={20} />
          </button>

          <div className="dc-breadcrumb">
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>DigitalCampus</span>
            <span style={{ color: '#CBD5E1' }}>/</span>
            <span className="dc-module-name">{moduleLabel}</span>
          </div>

          <div className="dc-topbar-right">
            <button className="dc-bell" aria-label="Notifications">
              <Bell size={17} />
            </button>

            <div className="dc-user-pill">
              <div className="dc-user-avatar">
                {(user.nom || user.login)[0].toUpperCase()}
              </div>
              <span className="dc-user-name">{user.nom || user.login}</span>
              <span className="dc-user-role-badge">{ROLE_LABELS[user.role] ?? user.role}</span>
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
                Vous n&apos;avez pas les permissions pour accéder à cette section.<br />
                Rôle actuel : <strong style={{ color: '#1AAFE6' }}>{ROLE_LABELS[user.role]}</strong>
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
