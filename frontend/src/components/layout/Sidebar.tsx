'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap, Users, BookOpen, ClipboardList,
  UserCheck, Award, FileText, BarChart2, CreditCard, BookMarked,
  ShieldCheck, Briefcase, ChevronRight, LogOut, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_NAV } from '@/lib/permissions'
import type { Role } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Administration', href: '/administrateur', icon: <ShieldCheck size={18} /> },
  { label: 'Scolarité', href: '/scolarite', icon: <GraduationCap size={18} /> },
  { label: 'Doyen', href: '/doyen', icon: <Briefcase size={18} /> },
  { label: 'Enseignants', href: '/enseignant', icon: <Users size={18} /> },
  { label: 'Professeurs', href: '/professeur', icon: <UserCheck size={18} /> },
  { label: 'Cours', href: '/cours', icon: <BookOpen size={18} /> },
  { label: 'Inscriptions', href: '/inscription', icon: <ClipboardList size={18} /> },
  { label: 'Anonymat', href: '/anonymat', icon: <ShieldCheck size={18} /> },
  { label: 'DAARHSPE', href: '/daarhspe', icon: <FileText size={18} /> },
  { label: 'Gestion des Notes', href: '/gesnote', icon: <Award size={18} /> },
  { label: 'Soutenance', href: '/soutenance', icon: <BookMarked size={18} /> },
  { label: 'Suivi', href: '/suivi', icon: <BarChart2 size={18} /> },
  { label: 'Caisse', href: '/caisse', icon: <CreditCard size={18} /> },
  { label: 'PVD', href: '/pvd', icon: <FileText size={18} /> },
]


interface SidebarProps {
  role?: Role
  etablissement?: string
  university?: string
  onLogout?: () => void
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({
  role, etablissement, university, onLogout, open = true, onClose,
}: SidebarProps) {
  const pathname = usePathname()

  const allowedRoutes = role ? ROLE_NAV[role] ?? [] : []
  const items = ALL_NAV_ITEMS.filter(item => allowedRoutes.includes(item.href))

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={cn('sidebar', open && 'sidebar--open')}>
        <style>{`
          .sidebar-overlay {
            display: none;
          }
          @media (max-width: 1023px) {
            .sidebar-overlay {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.5);
              z-index: 39;
            }
          }
          .sidebar {
            width: 250px;
            min-height: 100vh;
            background: linear-gradient(180deg, #0E3358 0%, #081A2E 100%);
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 40;
            transition: transform 0.25s ease;
          }
          @media (max-width: 1023px) {
            .sidebar {
              transform: translateX(-100%);
            }
            .sidebar--open {
              transform: translateX(0);
            }
          }
          .sidebar-header {
            padding: 1.25rem 1.25rem 1rem;
            border-bottom: 1px solid rgba(26,175,230,0.15);
            display: flex;
            align-items: center;
            gap: 0.625rem;
          }
          .sidebar-logo-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: rgba(26,175,230,0.15);
            border: 1px solid rgba(26,175,230,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .sidebar-logo-text {
            flex: 1;
            min-width: 0;
          }
          .sidebar-logo-name {
            color: #ffffff;
            font-weight: 700;
            font-size: 0.9375rem;
            line-height: 1.2;
          }
          .sidebar-logo-sub {
            color: #90B4CC;
            font-size: 0.75rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .sidebar-close {
            background: none;
            border: none;
            color: #90B4CC;
            cursor: pointer;
            display: none;
            padding: 4px;
            border-radius: 6px;
          }
          .sidebar-close:hover { color: #ffffff; background: rgba(255,255,255,0.08); }
          @media (max-width: 1023px) {
            .sidebar-close { display: flex; }
          }
          .sidebar-nav {
            flex: 1;
            padding: 0.75rem 0.75rem;
            overflow-y: auto;
          }
          .sidebar-nav::-webkit-scrollbar { width: 4px; }
          .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
          .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(200,216,232,0.2); border-radius: 2px; }
          .nav-item {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            padding: 0.625rem 0.875rem;
            border-radius: 8px;
            color: #C8D8E8;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            transition: background 0.15s, color 0.15s;
            margin-bottom: 2px;
          }
          .nav-item:hover {
            background: rgba(26,175,230,0.12);
            color: #ffffff;
          }
          .nav-item.active {
            background: rgba(26,175,230,0.18);
            color: #1AAFE6;
            border-left: 3px solid #1AAFE6;
            padding-left: calc(0.875rem - 3px);
          }
          .nav-item-label { flex: 1; }
          .nav-item-chevron { opacity: 0.4; }
          .sidebar-footer {
            padding: 0.75rem;
            border-top: 1px solid rgba(200,216,232,0.1);
          }
          .btn-logout {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 0.625rem;
            padding: 0.625rem 0.875rem;
            border: none;
            border-radius: 8px;
            background: rgba(239,68,68,0.1);
            color: #fca5a5;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
          }
          .btn-logout:hover { background: rgba(239,68,68,0.2); }
          .sidebar-etab {
            padding: 0.5rem 1.25rem 0.75rem;
            color: #90B4CC;
            font-size: 0.75rem;
          }
        `}</style>

        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <GraduationCap size={20} color="#1AAFE6" />
          </div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-name">DigitalCampus</div>
            <div className="sidebar-logo-sub">{etablissement ?? university ?? 'Système'}</div>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Fermer le menu">
            <X size={16} />
          </button>
        </div>

        {university && etablissement && (
          <div className="sidebar-etab">{university}</div>
        )}

        <nav className="sidebar-nav">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('nav-item', active && 'active')}
              >
                {item.icon}
                <span className="nav-item-label">{item.label}</span>
                {!active && <ChevronRight size={14} className="nav-item-chevron" />}
              </Link>
            )
          })}
        </nav>

        {onLogout && (
          <div className="sidebar-footer">
            <button className="btn-logout" onClick={onLogout}>
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
