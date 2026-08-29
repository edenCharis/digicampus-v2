'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap, Users, BookOpen, ClipboardList,
  UserCheck, Award, FileText, BarChart2, CreditCard, BookMarked,
  ShieldCheck, Briefcase, LogOut, X, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_NAV } from '@/lib/permissions'
import type { Role } from '@/types'

interface NavItem { label: string; href: string; icon: React.ReactNode }

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Administration',    href: '/administrateur', icon: <ShieldCheck size={17} /> },
  { label: 'Scolarité',         href: '/scolarite',      icon: <GraduationCap size={17} /> },
  { label: 'Doyen',             href: '/doyen',          icon: <Briefcase size={17} /> },
  { label: 'Enseignants',       href: '/enseignant',     icon: <Users size={17} /> },
  { label: 'Professeurs',       href: '/professeur',     icon: <UserCheck size={17} /> },
  { label: 'Cours',             href: '/cours',          icon: <BookOpen size={17} /> },
  { label: 'Inscriptions',      href: '/inscription',    icon: <ClipboardList size={17} /> },
  { label: 'Anonymat',          href: '/anonymat',       icon: <ShieldCheck size={17} /> },
  { label: 'DAARHSPE',          href: '/daarhspe',       icon: <FileText size={17} /> },
  { label: 'Gestion des Notes', href: '/gesnote',        icon: <Award size={17} /> },
  { label: 'Soutenance',        href: '/soutenance',     icon: <BookMarked size={17} /> },
  { label: 'Suivi',             href: '/suivi',          icon: <BarChart2 size={17} /> },
  { label: 'Caisse',            href: '/caisse',         icon: <CreditCard size={17} /> },
  { label: 'PVD',               href: '/pvd',            icon: <FileText size={17} /> },
]

interface SidebarProps {
  role?: Role
  nom?: string
  etablissement?: string
  onLogout?: () => void
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ role, nom, etablissement, onLogout, open = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const allowedRoutes = role ? ROLE_NAV[role] ?? [] : []
  const items = ALL_NAV_ITEMS.filter(i => allowedRoutes.includes(i.href))

  const initials = (nom ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const roleLabel = role?.charAt(0).toUpperCase() + (role?.slice(1) ?? '')

  return (
    <>
      {open && <div className="sb-overlay" onClick={onClose} aria-hidden />}

      <aside className={cn('sb', open && 'sb--open')}>
        <style>{`
          /* ── overlay ── */
          .sb-overlay { display: none; }
          @media (max-width: 1023px) {
            .sb-overlay {
              display: block; position: fixed; inset: 0;
              background: rgba(0,0,0,0.55); z-index: 39; backdrop-filter: blur(2px);
            }
          }

          /* ── shell ── */
          .sb {
            width: 256px; min-height: 100vh;
            background: #080F1A;
            display: flex; flex-direction: column;
            position: fixed; top: 0; left: 0; bottom: 0; z-index: 40;
            transition: transform 0.22s cubic-bezier(.4,0,.2,1);
            border-right: 1px solid rgba(26,175,230,0.08);
          }
          @media (max-width: 1023px) {
            .sb { transform: translateX(-100%); }
            .sb--open { transform: translateX(0); box-shadow: 24px 0 60px rgba(0,0,0,0.5); }
          }

          /* ── header / brand ── */
          .sb-brand {
            padding: 1.375rem 1.25rem 1.125rem;
            display: flex; align-items: center; gap: 0.75rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            position: relative;
          }
          .sb-monogram {
            width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
            background: linear-gradient(135deg, #0E3358 0%, #1AAFE6 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 0.8rem; font-weight: 800; color: #fff;
            letter-spacing: -0.02em; box-shadow: 0 2px 12px rgba(26,175,230,0.35);
          }
          .sb-wordmark { flex: 1; min-width: 0; }
          .sb-app-name {
            color: #fff; font-weight: 700; font-size: 0.9375rem; line-height: 1.2;
            letter-spacing: -0.01em;
          }
          .sb-app-name span { color: #1AAFE6; }
          .sb-etab {
            font-size: 0.7rem; color: #4B6A85; margin-top: 1px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            max-width: 160px;
          }
          .sb-close {
            background: none; border: none; color: #4B6A85; cursor: pointer;
            padding: 4px; border-radius: 6px; display: none;
          }
          .sb-close:hover { color: #fff; background: rgba(255,255,255,0.06); }
          @media (max-width: 1023px) { .sb-close { display: flex; } }

          /* ── nav ── */
          .sb-nav {
            flex: 1; padding: 0.875rem 0.75rem;
            overflow-y: auto; display: flex; flex-direction: column; gap: 2px;
          }
          .sb-nav::-webkit-scrollbar { width: 3px; }
          .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }

          .sb-item {
            display: flex; align-items: center; gap: 0.75rem;
            padding: 0.625rem 0.875rem;
            border-radius: 9px; text-decoration: none;
            color: #5A7A96; font-size: 0.875rem; font-weight: 500;
            transition: all 0.15s ease;
            position: relative;
          }
          .sb-item:hover { background: rgba(255,255,255,0.04); color: #C8D8E8; }
          .sb-item:hover .sb-icon { color: #C8D8E8; }

          .sb-icon {
            width: 32px; height: 32px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: all 0.15s;
            color: #5A7A96;
          }
          .sb-item.active {
            background: rgba(26,175,230,0.1);
            color: #E2EDF5;
          }
          .sb-item.active .sb-icon {
            background: rgba(26,175,230,0.18);
            color: #1AAFE6;
            box-shadow: 0 0 0 1px rgba(26,175,230,0.25);
          }
          .sb-item.active::before {
            content: '';
            position: absolute; left: 0; top: 25%; bottom: 25%;
            width: 3px; border-radius: 0 3px 3px 0;
            background: #1AAFE6;
            box-shadow: 0 0 8px rgba(26,175,230,0.6);
          }
          .sb-label { flex: 1; }
          .sb-arrow { opacity: 0; transition: opacity 0.15s; }
          .sb-item:hover .sb-arrow { opacity: 0.4; }

          /* ── user card ── */
          .sb-user {
            padding: 0.875rem 0.75rem;
            border-top: 1px solid rgba(255,255,255,0.05);
          }
          .sb-user-card {
            display: flex; align-items: center; gap: 0.75rem;
            padding: 0.625rem 0.75rem; border-radius: 9px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
          }
          .sb-avatar {
            width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
            background: linear-gradient(135deg, #0E3358, #1AAFE6);
            display: flex; align-items: center; justify-content: center;
            font-size: 0.75rem; font-weight: 700; color: #fff;
          }
          .sb-user-info { flex: 1; min-width: 0; }
          .sb-user-name {
            color: #C8D8E8; font-size: 0.8125rem; font-weight: 600;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .sb-user-role {
            font-size: 0.67rem; font-weight: 600; color: #1AAFE6;
            text-transform: uppercase; letter-spacing: 0.06em; margin-top: 1px;
          }
          .sb-logout {
            background: none; border: none; cursor: pointer; padding: 6px;
            color: #4B6A85; border-radius: 7px; display: flex; align-items: center;
            transition: all 0.15s;
          }
          .sb-logout:hover { background: rgba(239,68,68,0.12); color: #fca5a5; }
        `}</style>

        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-monogram">DC</div>
          <div className="sb-wordmark">
            <div className="sb-app-name">Digital<span>Campus</span></div>
            {etablissement && <div className="sb-etab">{etablissement}</div>}
          </div>
          <button className="sb-close" onClick={onClose} aria-label="Fermer">
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} className={cn('sb-item', active && 'active')}>
                <div className="sb-icon">{item.icon}</div>
                <span className="sb-label">{item.label}</span>
                {!active && <ChevronRight size={13} className="sb-arrow" />}
              </Link>
            )
          })}
        </nav>

        {/* User card */}
        <div className="sb-user">
          <div className="sb-user-card">
            <div className="sb-avatar">{initials}</div>
            <div className="sb-user-info">
              <div className="sb-user-name">{nom ?? 'Utilisateur'}</div>
              <div className="sb-user-role">{roleLabel}</div>
            </div>
            {onLogout && (
              <button className="sb-logout" onClick={onLogout} title="Déconnexion">
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
