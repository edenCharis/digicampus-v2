'use client'
import { useEffect, useState } from 'react'
import { Building2, GraduationCap, Users, Wifi, BarChart2, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AdminStats, LogEntry } from './_shared'
import { ROLE_COLORS } from './_shared'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<AdminStats>('/admin-stats/').then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  const connexionTrend = stats ? stats.connexions_today - stats.connexions_yesterday : 0
  const maxConn = Math.max(...(stats?.connexions_week.map(d => d.count) ?? [1]), 1)

  const kpis = [
    { label: 'Universités',      value: stats?.universities ?? '—',   icon: Building2,     color: '#1AAFE6', bg: 'rgba(26,175,230,0.08)',  sub: 'Partenaires actifs' },
    { label: 'Établissements',   value: stats?.etablissements ?? '—', icon: GraduationCap, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', sub: 'Facultés & écoles' },
    { label: 'Comptes actifs',   value: stats?.users_total ?? '—',    icon: Users,         color: '#10b981', bg: 'rgba(16,185,129,0.08)', sub: 'Utilisateurs du système' },
    {
      label: "Connexions aujourd'hui",
      value: stats?.connexions_today ?? '—',
      icon: Wifi, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',
      sub: connexionTrend === 0 ? 'Stable' : connexionTrend > 0 ? `+${connexionTrend} vs hier` : `${connexionTrend} vs hier`,
      trend: connexionTrend,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-[1.375rem] font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-slate-400 mt-0.5">Digital Technology Congo — Vue d'ensemble de la plateforme</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <Card key={k.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                    <Icon size={17} style={{ color: k.color }} />
                  </div>
                  {k.trend !== undefined && k.trend !== 0 && (
                    <span className={cn('flex items-center gap-0.5 text-xs font-semibold', k.trend > 0 ? 'text-emerald-500' : 'text-red-400')}>
                      {k.trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(k.trend)}
                    </span>
                  )}
                  {k.trend === 0 && k.trend !== undefined && <Minus size={13} className="text-slate-300" />}
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {loading ? <span className="text-slate-200">—</span> : k.value}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{k.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{k.sub}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Sparkbar connexions */}
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-bold text-slate-900 text-sm">Connexions — 7 derniers jours</div>
                <div className="text-xs text-slate-400 mt-0.5">Activité quotidienne de la plateforme</div>
              </div>
              <BarChart2 size={16} className="text-slate-300" />
            </div>
            <div className="flex items-end gap-2 h-28">
              {(stats?.connexions_week ?? Array(7).fill({ date: '', count: 0 })).map((d, i) => {
                const h = maxConn > 0 ? Math.max(4, Math.round((d.count / maxConn) * 96)) : 4
                const isToday = i === 6
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-semibold text-slate-400">{d.count || ''}</span>
                    <div className="w-full rounded-md transition-all" style={{
                      height: `${h}px`,
                      background: isToday ? '#1AAFE6' : 'rgba(26,175,230,0.18)',
                    }} />
                    <span className="text-[9px] text-slate-400">
                      {d.date ? new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }) : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Rôles */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="font-bold text-slate-900 text-sm mb-1">Comptes par rôle</div>
            <div className="text-xs text-slate-400 mb-4">Répartition des utilisateurs</div>
            <div className="space-y-2.5">
              {loading
                ? Array(5).fill(0).map((_, i) => <div key={i} className="h-5 bg-slate-100 rounded animate-pulse" />)
                : stats?.users_by_role.slice(0, 6).map(r => {
                    const color = ROLE_COLORS[r.role] ?? '#64748b'
                    const pct = stats.users_total > 0 ? Math.round((r.count / stats.users_total) * 100) : 0
                    return (
                      <div key={r.role}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-700 capitalize">{r.role}</span>
                          <span className="text-xs font-bold text-slate-500">{r.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    )
                  })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
          <div className="font-bold text-slate-900 text-sm">Activité récente</div>
          <Activity size={14} className="text-slate-300" />
        </div>
        {loading
          ? <div className="p-5 space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}</div>
          : !stats?.recent_logs.length
            ? <div className="py-10 text-center text-slate-400 text-sm">Aucune activité récente.</div>
            : stats.recent_logs.map((log: LogEntry, i: number) => (
              <div key={log.id} className={cn('flex items-center gap-3 px-5 py-3', i < stats.recent_logs.length - 1 && 'border-b border-slate-50')}>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <Activity size={13} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-800 truncate">
                    <span className="font-semibold">{log.user_nom || log.user_login || 'Système'}</span>
                    <span className="text-slate-400 ml-1.5">{log.description}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{log.university_name ?? ''}</div>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0">
                  {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
      </Card>
    </div>
  )
}
