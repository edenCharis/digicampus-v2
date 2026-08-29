'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Bell, Search } from 'lucide-react'
import Sidebar from './Sidebar'
import { AppUser } from '@/types'
import { ROLE_LABELS } from '@/lib/utils'
import { logout as apiLogout, clearTokens } from '@/lib/api'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<AppUser | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('dc_user')
    if (!stored) {
      router.replace('/login')
      return
    }
    setUser(JSON.parse(stored))
  }, [router])

  async function handleLogout() {
    const tokens = localStorage.getItem('dc_tokens')
    const refresh = tokens ? JSON.parse(tokens).refresh : null
    if (refresh) await apiLogout(refresh)
    else clearTokens()
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="dc-layout">
      <style>{`
        .dc-layout {
          min-height: 100vh;
          background: #f0f4f8;
        }
        .dc-topbar {
          height: 56px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          gap: 1rem;
          position: fixed;
          top: 0;
          left: 250px;
          right: 0;
          z-index: 30;
        }
        @media (max-width: 1023px) {
          .dc-topbar { left: 0; }
          .dc-content { margin-left: 0 !important; }
        }
        .topbar-hamburger {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: none;
        }
        @media (max-width: 1023px) {
          .topbar-hamburger { display: flex; align-items: center; }
        }
        .topbar-hamburger:hover { background: #f1f5f9; color: #1e293b; }
        .topbar-search {
          flex: 1;
          max-width: 360px;
          position: relative;
        }
        .topbar-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .topbar-search input {
          width: 100%;
          padding: 0.4375rem 0.75rem 0.4375rem 2.25rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.875rem;
          background: #f8fafc;
          outline: none;
          color: #1e293b;
        }
        .topbar-search input:focus {
          border-color: #1AAFE6;
          background: #fff;
        }
        .topbar-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .topbar-bell {
          position: relative;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
        }
        .topbar-bell:hover { background: #f1f5f9; color: #1e293b; }
        .topbar-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .topbar-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0E3358, #1AAFE6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 0.8125rem;
          font-weight: 600;
          flex-shrink: 0;
        }
        .topbar-user-info { line-height: 1.3; }
        .topbar-user-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1e293b;
        }
        .topbar-user-role {
          font-size: 0.7rem;
          color: #1AAFE6;
          font-weight: 500;
        }
        .dc-content {
          margin-left: 250px;
          padding-top: 56px;
          min-height: 100vh;
        }
        .dc-page {
          padding: 1.5rem;
        }
      `}</style>

      <Sidebar
        role={user.role}
        etablissement={user.etablissement_name ?? undefined}
        university={user.university_name ?? undefined}
        onLogout={handleLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dc-content">
        <header className="dc-topbar">
          <button
            className="topbar-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>

          <div className="topbar-search">
            <span className="topbar-search-icon"><Search size={15} /></span>
            <input type="search" placeholder="Rechercher…" />
          </div>

          <div className="topbar-right">
            <button className="topbar-bell" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="topbar-user">
              <div className="topbar-avatar">
                {user.nom ? user.nom[0].toUpperCase() : user.login[0].toUpperCase()}
              </div>
              <div className="topbar-user-info">
                <div className="topbar-user-name">{user.nom || user.login}</div>
                <div className="topbar-user-role">{ROLE_LABELS[user.role] ?? user.role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="dc-page">
          {children}
        </main>
      </div>
    </div>
  )
}
