'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  GraduationCap, Users, BookOpen, ClipboardList,
  UserCheck, Award, FileText, BarChart2, CreditCard, BookMarked,
  ShieldCheck, Briefcase, LogOut, X, ChevronRight, ChevronDown,
  Building2, Activity, Settings, Globe, CalendarDays, RotateCcw,
  Layers, GitFork,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_NAV } from '@/lib/permissions'
import type { Role } from '@/types'

interface NavLeaf  { label: string; href: string; icon: React.ReactNode; exact?: boolean }
interface NavGroup { label: string; icon: React.ReactNode; children: NavLeaf[] }
type SidebarItem = NavLeaf | NavGroup

function isGroup(item: SidebarItem): item is NavGroup {
  return 'children' in item
}

const ALL_NAV_ITEMS: SidebarItem[] = [
  // Admin
  { label: 'Tableau de bord',  href: '/administrateur',               icon: <BarChart2 size={17} />,     exact: true },
  { label: 'Universités',      href: '/administrateur/universites',    icon: <Building2 size={17} /> },
  { label: 'Établissements',   href: '/administrateur/etablissements', icon: <GraduationCap size={17} /> },
  { label: 'Comptes',          href: '/administrateur/comptes',        icon: <Users size={17} /> },
  { label: 'Abonnements',      href: '/administrateur/abonnements',    icon: <Globe size={17} /> },
  { label: 'Logs',             href: '/administrateur/logs',           icon: <Activity size={17} /> },
  {
    label: 'Paramétrage',
    icon: <Settings size={17} />,
    children: [
      { label: 'Années',       href: '/administrateur/annees',         icon: <CalendarDays size={15} /> },
      { label: 'Cycles',       href: '/administrateur/cycles',         icon: <RotateCcw size={15} /> },
      { label: 'Parcours',     href: '/administrateur/parcours',       icon: <GitFork size={15} /> },
      { label: 'Spécialités',  href: '/administrateur/specialites',    icon: <BookMarked size={15} /> },
      { label: 'Semestres',    href: '/administrateur/semestres',      icon: <BookOpen size={15} /> },
      { label: 'Niveaux',      href: '/administrateur/niveaux',        icon: <Layers size={15} /> },
    ],
  },
  // Other roles
  { label: 'Scolarité',        href: '/scolarite',   icon: <GraduationCap size={17} /> },
  { label: 'Doyen',            href: '/doyen',        icon: <Briefcase size={17} /> },
  { label: 'Enseignants',      href: '/enseignant',   icon: <Users size={17} /> },
  { label: 'Professeurs',      href: '/professeur',   icon: <UserCheck size={17} /> },
  { label: 'Cours',            href: '/cours',        icon: <BookOpen size={17} /> },
  { label: 'Inscriptions',     href: '/inscription',  icon: <ClipboardList size={17} /> },
  { label: 'Anonymat',         href: '/anonymat',     icon: <ShieldCheck size={17} /> },
  { label: 'DAARHSPE',         href: '/daarhspe',     icon: <FileText size={17} /> },
  { label: 'Gestion des Notes',href: '/gesnote',      icon: <Award size={17} /> },
  { label: 'Soutenance',       href: '/soutenance',   icon: <BookMarked size={17} /> },
  { label: 'Suivi',            href: '/suivi',        icon: <BarChart2 size={17} /> },
  { label: 'Caisse',           href: '/caisse',       icon: <CreditCard size={17} /> },
  { label: 'PVD',              href: '/pvd',          icon: <FileText size={17} /> },
]

interface SidebarProps {
  role?: Role
  nom?: string
  photo?: string | null
  etablissement?: string
  onLogout?: () => void
  open?: boolean
  onClose?: () => void
  collapsed?: boolean
}

export default function Sidebar({ role, nom, photo, etablissement, onLogout, open = true, onClose, collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const allowedRoutes = role ? ROLE_NAV[role] ?? [] : []
  const [openGroups, setOpenGroups] = useState<string[]>([])

  // Filter items: leaves must be in allowedRoutes; groups must have at least one visible child
  const items = ALL_NAV_ITEMS.reduce<SidebarItem[]>((acc, item) => {
    if (isGroup(item)) {
      const visibleChildren = item.children.filter(c => allowedRoutes.includes(c.href))
      if (visibleChildren.length > 0) acc.push({ ...item, children: visibleChildren })
    } else {
      if (allowedRoutes.includes(item.href)) acc.push(item)
    }
    return acc
  }, [])

  // Auto-expand groups that contain the active route
  useEffect(() => {
    const toOpen: string[] = []
    for (const item of items) {
      if (isGroup(item)) {
        const hasActive = item.children.some(c =>
          pathname === c.href || pathname.startsWith(c.href + '/')
        )
        if (hasActive) toOpen.push(item.label)
      }
    }
    if (toOpen.length > 0) {
      setOpenGroups(prev => [...new Set([...prev, ...toOpen])])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  function toggleGroup(label: string) {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    )
  }

  const initials = (nom ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : ''

  return (
    <>
      {open && <div className="sb-overlay" onClick={onClose} aria-hidden />}

      <aside className={cn('sb', open && 'sb--open', collapsed && 'sb--collapsed')}>
        <style>{`
          .sb-overlay { display: none; }
          @media (max-width: 1023px) {
            .sb-overlay {
              display: block; position: fixed; inset: 0;
              background: rgba(0,0,0,0.55); z-index: 39;
              backdrop-filter: blur(2px);
            }
          }

          .sb {
            width: 256px; min-height: 100vh;
            background: #080F1A;
            display: flex; flex-direction: column;
            position: fixed; top: 0; left: 0; bottom: 0; z-index: 40;
            transition: width 0.22s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1);
            border-right: 1px solid rgba(26,175,230,0.08);
            overflow: hidden;
          }
          .sb--collapsed { width: 72px; }

          @media (max-width: 1023px) {
            .sb { transform: translateX(-100%); width: 256px !important; }
            .sb--open { transform: translateX(0); box-shadow: 24px 0 60px rgba(0,0,0,0.5); }
          }

          /* ── Brand ── */
          .sb-brand {
            padding: 1.25rem 0.875rem 1.125rem;
            display: flex; align-items: center; gap: 0.75rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            min-height: 64px; overflow: hidden; flex-shrink: 0;
          }
          .sb--collapsed .sb-brand { justify-content: center; padding: 1.25rem 0; }

          .sb-monogram {
            width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
            background: linear-gradient(135deg, #0E3358 0%, #1AAFE6 100%);
            display: flex; align-items: center; justify-content: center;
            font-size: 0.8rem; font-weight: 800; color: #fff;
            letter-spacing: -0.02em; box-shadow: 0 2px 12px rgba(26,175,230,0.35);
          }
          .sb-wordmark {
            flex: 1; min-width: 0; overflow: hidden;
            transition: opacity 0.15s, width 0.22s;
          }
          .sb--collapsed .sb-wordmark { opacity: 0; width: 0; pointer-events: none; }

          .sb-app-name {
            color: #fff; font-weight: 700; font-size: 0.9rem; line-height: 1.2;
            letter-spacing: -0.01em; white-space: nowrap;
          }
          .sb-app-name span { color: #1AAFE6; }
          .sb-etab {
            font-size: 0.68rem; color: #3A5570; margin-top: 2px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;
          }
          .sb-close {
            background: none; border: none; color: #4B6A85; cursor: pointer;
            padding: 4px; border-radius: 6px; display: none; flex-shrink: 0;
          }
          .sb-close:hover { color: #fff; background: rgba(255,255,255,0.06); }
          @media (max-width: 1023px) { .sb-close { display: flex; } }

          /* ── Nav ── */
          .sb-nav {
            flex: 1; padding: 0.75rem 0.625rem;
            overflow-y: auto; overflow-x: hidden;
            display: flex; flex-direction: column; gap: 2px;
          }
          .sb-nav::-webkit-scrollbar { width: 3px; }
          .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }

          /* Leaf nav items */
          .sb-item {
            display: flex; align-items: center; gap: 0.75rem;
            padding: 0.6rem 0.75rem; border-radius: 9px;
            text-decoration: none; color: #4A6A85;
            font-size: 0.875rem; font-weight: 500;
            transition: all 0.15s ease; position: relative;
            white-space: nowrap; overflow: hidden;
          }
          .sb--collapsed .sb-item { justify-content: center; padding: 0.6rem 0; }
          .sb-item:hover { background: rgba(255,255,255,0.04); color: #C8D8E8; }

          .sb-icon {
            width: 30px; height: 30px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: all 0.15s; color: #4A6A85;
          }
          .sb-item:hover .sb-icon { color: #C8D8E8; }

          .sb-item.active { background: rgba(26,175,230,0.1); color: #E2EDF5; }
          .sb-item.active .sb-icon {
            background: rgba(26,175,230,0.18); color: #1AAFE6;
            box-shadow: 0 0 0 1px rgba(26,175,230,0.25);
          }
          .sb-item.active::before {
            content: ''; position: absolute; left: 0; top: 25%; bottom: 25%;
            width: 3px; border-radius: 0 3px 3px 0;
            background: #1AAFE6; box-shadow: 0 0 8px rgba(26,175,230,0.6);
          }
          .sb-label {
            flex: 1; overflow: hidden; text-overflow: ellipsis;
            transition: opacity 0.15s, width 0.22s;
          }
          .sb--collapsed .sb-label { opacity: 0; width: 0; pointer-events: none; }

          .sb-arrow { opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
          .sb-item:hover .sb-arrow { opacity: 0.4; }
          .sb--collapsed .sb-arrow { display: none; }

          /* Tooltip when collapsed */
          .sb--collapsed .sb-item { position: relative; }
          .sb--collapsed .sb-item::after {
            content: attr(data-label);
            position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%);
            background: #1A2840; color: #C8D8E8; font-size: 0.8rem; font-weight: 500;
            padding: 0.35rem 0.75rem; border-radius: 7px; white-space: nowrap;
            border: 1px solid rgba(255,255,255,0.08); pointer-events: none;
            opacity: 0; transition: opacity 0.15s; z-index: 100;
          }
          .sb--collapsed .sb-item:hover::after { opacity: 1; }

          /* ── Group ── */
          .sb-group-btn {
            display: flex; align-items: center; gap: 0.75rem;
            padding: 0.6rem 0.75rem; border-radius: 9px;
            color: #4A6A85; font-size: 0.875rem; font-weight: 500;
            cursor: pointer; background: none; border: none; width: 100%;
            transition: all 0.15s ease; position: relative;
            white-space: nowrap; overflow: hidden; text-align: left;
          }
          .sb--collapsed .sb-group-btn { justify-content: center; padding: 0.6rem 0; }
          .sb-group-btn:hover { background: rgba(255,255,255,0.04); color: #C8D8E8; }
          .sb-group-btn.group-open { color: #C8D8E8; }
          .sb-group-btn.group-has-active { color: #E2EDF5; }
          .sb-group-btn.group-has-active .sb-icon {
            background: rgba(26,175,230,0.12); color: #1AAFE6;
          }

          .sb-group-chevron {
            margin-left: auto; flex-shrink: 0; color: #3A5570;
            transition: transform 0.2s, opacity 0.15s; opacity: 0;
          }
          .sb-group-btn:hover .sb-group-chevron { opacity: 0.7; }
          .sb-group-btn.group-open .sb-group-chevron { transform: rotate(180deg); opacity: 0.7; }
          .sb--collapsed .sb-group-chevron { display: none; }

          /* Tooltip for group when collapsed */
          .sb--collapsed .sb-group-btn::after {
            content: attr(data-label);
            position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%);
            background: #1A2840; color: #C8D8E8; font-size: 0.8rem; font-weight: 500;
            padding: 0.35rem 0.75rem; border-radius: 7px; white-space: nowrap;
            border: 1px solid rgba(255,255,255,0.08); pointer-events: none;
            opacity: 0; transition: opacity 0.15s; z-index: 100;
          }
          .sb--collapsed .sb-group-btn:hover::after { opacity: 1; }

          /* Sub-items */
          .sb-children {
            overflow: hidden;
            transition: max-height 0.25s cubic-bezier(.4,0,.2,1), opacity 0.2s;
            max-height: 0; opacity: 0;
          }
          .sb-children.open { max-height: 400px; opacity: 1; }
          .sb--collapsed .sb-children { display: none; }

          .sb-sub-item {
            display: flex; align-items: center; gap: 0.625rem;
            padding: 0.45rem 0.75rem 0.45rem 2.5rem;
            border-radius: 7px; text-decoration: none; color: #3A5570;
            font-size: 0.8125rem; font-weight: 500;
            transition: all 0.15s ease; position: relative;
            white-space: nowrap; overflow: hidden;
          }
          .sb-sub-item:hover { background: rgba(255,255,255,0.04); color: #C8D8E8; }
          .sb-sub-item.active { color: #1AAFE6; background: rgba(26,175,230,0.08); }
          .sb-sub-item.active::before {
            content: ''; position: absolute; left: 1.5rem; top: 50%; transform: translateY(-50%);
            width: 4px; height: 4px; border-radius: 50%; background: #1AAFE6;
          }
          .sb-sub-icon { flex-shrink: 0; opacity: 0.6; }
          .sb-sub-item:hover .sb-sub-icon,
          .sb-sub-item.active .sb-sub-icon { opacity: 1; }

          /* separator */
          .sb-sep {
            height: 1px; background: rgba(255,255,255,0.04);
            margin: 6px 0.5rem;
          }

          /* ── User card ── */
          .sb-user {
            padding: 0.75rem 0.625rem;
            border-top: 1px solid rgba(255,255,255,0.05);
            flex-shrink: 0;
          }
          .sb-user-card {
            display: flex; align-items: center; gap: 0.625rem;
            padding: 0.5rem 0.625rem; border-radius: 9px;
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);
            overflow: hidden;
          }
          .sb--collapsed .sb-user-card { justify-content: center; padding: 0.5rem 0; border: none; background: none; }

          .sb-avatar {
            width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
            background: linear-gradient(135deg, #0E3358, #1AAFE6);
            display: flex; align-items: center; justify-content: center;
            font-size: 0.72rem; font-weight: 700; color: #fff;
            overflow: hidden;
          }
          .sb-user-info {
            flex: 1; min-width: 0; overflow: hidden;
            transition: opacity 0.15s, width 0.22s;
          }
          .sb--collapsed .sb-user-info { opacity: 0; width: 0; pointer-events: none; }

          .sb-user-name {
            color: #C8D8E8; font-size: 0.8rem; font-weight: 600;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .sb-user-role {
            font-size: 0.65rem; font-weight: 600; color: #1AAFE6;
            text-transform: uppercase; letter-spacing: 0.06em; margin-top: 1px;
          }
          .sb-logout {
            background: none; border: none; cursor: pointer; padding: 5px;
            color: #4B6A85; border-radius: 7px; display: flex; align-items: center;
            transition: all 0.15s; flex-shrink: 0;
          }
          .sb-logout:hover { background: rgba(239,68,68,0.12); color: #fca5a5; }
          .sb--collapsed .sb-logout { display: none; }
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
          {items.map((item, idx) => {
            if (isGroup(item)) {
              const isOpen = openGroups.includes(item.label)
              const hasActive = item.children.some(c =>
                pathname === c.href || pathname.startsWith(c.href + '/')
              )
              return (
                <div key={item.label}>
                  {idx > 0 && <div className="sb-sep" />}
                  <button
                    className={cn('sb-group-btn', isOpen && 'group-open', hasActive && 'group-has-active')}
                    data-label={item.label}
                    onClick={() => !collapsed && toggleGroup(item.label)}
                  >
                    <div className="sb-icon">{item.icon}</div>
                    <span className="sb-label">{item.label}</span>
                    <ChevronDown size={13} className="sb-group-chevron" />
                  </button>
                  <div className={cn('sb-children', isOpen && 'open')}>
                    {item.children.map(child => {
                      const active = pathname === child.href || pathname.startsWith(child.href + '/')
                      return (
                        <Link key={child.href} href={child.href}
                          className={cn('sb-sub-item', active && 'active')}>
                          <span className="sb-sub-icon">{child.icon}</span>
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                  {idx < items.length - 1 && <div className="sb-sep" />}
                </div>
              )
            }
            const active = (item as NavLeaf).exact
              ? pathname === (item as NavLeaf).href
              : pathname === (item as NavLeaf).href || pathname.startsWith((item as NavLeaf).href + '/')
            return (
              <Link key={(item as NavLeaf).href} href={(item as NavLeaf).href}
                data-label={item.label}
                className={cn('sb-item', active && 'active')}>
                <div className="sb-icon">{item.icon}</div>
                <span className="sb-label">{item.label}</span>
                {!active && <ChevronRight size={12} className="sb-arrow" />}
              </Link>
            )
          })}
        </nav>

        {/* User card */}
        <div className="sb-user">
          <div className="sb-user-card">
            <div className="sb-avatar">
              {photo
                ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div className="sb-user-info">
              <div className="sb-user-name">{nom ?? 'Utilisateur'}</div>
              <div className="sb-user-role">{roleLabel}</div>
            </div>
            {onLogout && (
              <button className="sb-logout" onClick={onLogout} title="Déconnexion">
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
