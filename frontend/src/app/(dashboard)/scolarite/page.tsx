'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, ClipboardList, BookOpen, LayoutGrid, TrendingUp, ArrowRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Stats {
  etudiants: number
  classes: number
  ues: number
  inscriptions: number
  annee_active: string | null
}

export default function ScolariteDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Stats>('/stats/').then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  const fmt = (n: number | undefined) => loading ? '—' : (n ?? 0).toLocaleString('fr-FR')

  const kpis = [
    {
      label: 'Inscriptions',
      value: fmt(stats?.inscriptions),
      sub: stats?.annee_active ?? 'Aucune année active',
      icon: ClipboardList,
      color: '#1AAFE6',
      bg: 'rgba(26,175,230,0.08)',
      href: '/scolarite/inscriptions',
      trend: '+12%',
    },
    {
      label: 'Étudiants',
      value: fmt(stats?.etudiants),
      sub: 'Total enregistrés',
      icon: Users,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.08)',
      href: '/scolarite/inscriptions',
      trend: null,
    },
    {
      label: 'Classes',
      value: fmt(stats?.classes),
      sub: 'Groupes actifs',
      icon: LayoutGrid,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.08)',
      href: '/scolarite/classes',
      trend: null,
    },
    {
      label: 'Unités d\'enseignement',
      value: fmt(stats?.ues),
      sub: 'UE configurées',
      icon: BookOpen,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      href: '/scolarite/ues',
      trend: null,
    },
  ]

  const shortcuts = [
    { label: 'Nouvelle inscription', href: '/scolarite/inscriptions', icon: ClipboardList, desc: 'Inscrire un étudiant', accent: '#1AAFE6' },
    { label: 'Gérer les classes',    href: '/scolarite/classes',      icon: LayoutGrid,    desc: 'Classes & niveaux',   accent: '#10b981' },
    { label: 'Unités d\'enseign.',   href: '/scolarite/ues',          icon: BookOpen,      desc: 'UE & ECUE',          accent: '#f59e0b' },
    { label: 'Étudiants',            href: '/scolarite/inscriptions', icon: Users,         desc: 'Liste des étudiants', accent: '#8b5cf6' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scolarité</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestion des inscriptions, classes et paramétrage académique
            {stats?.annee_active && (
              <span className="ml-2 font-semibold text-brand">{stats.annee_active}</span>
            )}
          </p>
        </div>
        {stats?.annee_active && (
          <Badge variant="default" className="shrink-0 mt-1">
            Année active : {stats.annee_active}
          </Badge>
        )}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Link key={k.label} href={k.href} className="block group">
              <Card className="hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: k.bg }}>
                      <Icon size={18} style={{ color: k.color }} />
                    </div>
                    {k.trend && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                        <TrendingUp size={11} /> {k.trend}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">{k.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{k.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{k.sub}</div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Actions rapides</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {shortcuts.map((s) => {
            const Icon = s.icon
            return (
              <Link key={s.label} href={s.href} className="block group">
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group-hover:border-slate-300">
                  <CardContent className="p-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${s.accent}14` }}
                    >
                      <Icon size={19} style={{ color: s.accent }} />
                    </div>
                    <div className="font-semibold text-slate-800 text-sm leading-tight">{s.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.desc}</div>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: s.accent }}>
                      Accéder <ArrowRight size={11} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
