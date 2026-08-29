'use client'
import { useEffect, useState } from 'react'
import {
  Building2, GraduationCap, Users, Wifi,
  TrendingUp, TrendingDown,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { AdminStats } from './_shared'
import { ROLE_COLORS } from './_shared'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<AdminStats>('/admin-stats/').then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  const connexionTrend = stats ? stats.connexions_today - stats.connexions_yesterday : 0
  const maxConn = Math.max(...(stats?.connexions_week.map(d => d.count) ?? [1]), 1)

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <style>{`
        .adm-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        @media (max-width: 900px) { .adm-kpi { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .adm-kpi { grid-template-columns: 1fr; } }

        .adm-mid { display: grid; grid-template-columns: 1fr 380px; gap: 1rem; margin-top: 1rem; }
        @media (max-width: 900px) { .adm-mid { grid-template-columns: 1fr; } }

        /* KPI card */
        .kpi-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 1.25rem 1.25rem 1rem;
          box-shadow: 0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.02);
          position: relative; overflow: hidden;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .kpi-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--kpi-color, #1AAFE6);
          opacity: 0; transition: opacity 0.2s;
        }
        .kpi-card:hover::before { opacity: 1; }
        .kpi-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.07); border-color: #e9eef5; }
        .kpi-num {
          font-size: 2rem; font-weight: 800; color: #0f172a;
          letter-spacing: -0.04em; line-height: 1; margin: 0.5rem 0 0.25rem;
          font-variant-numeric: tabular-nums;
        }
        .kpi-label { font-size: 0.8125rem; font-weight: 600; color: #64748b; }
        .kpi-sub { font-size: 0.72rem; color: #94a3b8; margin-top: 0.25rem; }
        .kpi-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .kpi-trend {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 0.72rem; font-weight: 700; border-radius: 20px;
          padding: 0.15rem 0.5rem; margin-top: 0.5rem;
        }

        /* Section card */
        .section-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.04);
          overflow: hidden;
        }
        .section-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem 0.875rem;
          border-bottom: 1px solid #f8fafc;
        }
        .section-title { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
        .section-sub { font-size: 0.75rem; color: #94a3b8; margin-top: 1px; }

        /* Chart bars */
        .bar-wrap { display: flex; align-items: flex-end; gap: 6px; height: 80px; padding: 0 1.25rem 0; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .bar-val { font-size: 9px; font-weight: 600; color: #94a3b8; }
        .bar { width: 100%; border-radius: 4px; transition: all 0.3s; }
        .bar-day { font-size: 9px; color: #cbd5e1; margin-top: 4px; }

        /* Role bars */
        .role-row { padding: 0.6rem 1.25rem; }
        .role-bar-track { height: 4px; background: #f1f5f9; border-radius: 99px; overflow: hidden; margin-top: 5px; }
        .role-bar-fill { height: 100%; border-radius: 99px; }

        /* Skeleton */
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .skel { background: #f1f5f9; border-radius: 6px; animation: pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          Tableau de bord
        </h1>
        <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: 3 }}>
          Digital Technology Congo — Plateforme Digital Campus
        </p>
      </div>

      {/* KPIs */}
      <div className="adm-kpi">
        {[
          { label: 'Universités',        value: stats?.universities,    icon: Building2,     color: '#1AAFE6', bg: 'rgba(26,175,230,0.08)',  trend: null,           sub: 'Partenaires actifs' },
          { label: 'Établissements',     value: stats?.etablissements,  icon: GraduationCap, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', trend: null,           sub: 'Facultés & écoles' },
          { label: 'Comptes actifs',     value: stats?.users_total,     icon: Users,         color: '#10b981', bg: 'rgba(16,185,129,0.08)', trend: null,           sub: 'Utilisateurs total' },
          { label: 'Connexions du jour', value: stats?.connexions_today, icon: Wifi,         color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', trend: connexionTrend, sub: 'vs hier' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties}>
              <div className="kpi-icon" style={{ background: k.bg }}>
                <Icon size={16} style={{ color: k.color }} />
              </div>
              <div className="kpi-num">
                {loading ? <span className="skel" style={{ display: 'block', width: 60, height: 32 }} /> : (k.value ?? '—')}
              </div>
              <div className="kpi-label">{k.label}</div>
              {k.trend !== null && !loading && (
                <div className="kpi-trend" style={{
                  background: k.trend === 0 ? '#f8fafc' : k.trend > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.07)',
                  color: k.trend === 0 ? '#94a3b8' : k.trend > 0 ? '#10b981' : '#ef4444',
                }}>
                  {k.trend > 0 ? <TrendingUp size={10} /> : k.trend < 0 ? <TrendingDown size={10} /> : null}
                  {k.trend > 0 ? '+' : ''}{k.trend} {k.sub}
                </div>
              )}
              {k.trend === null && <div className="kpi-sub">{k.sub}</div>}
            </div>
          )
        })}
      </div>

      <div className="adm-mid">
        {/* Chart connexions */}
        <div className="section-card">
          <div className="section-head">
            <div>
              <div className="section-title">Connexions — 7 jours</div>
              <div className="section-sub">Nombre de logins par jour</div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {loading ? '—' : stats?.connexions_today ?? 0}
            </span>
          </div>
          <div className="bar-wrap">
            {(stats?.connexions_week ?? Array(7).fill({ date: '', count: 0 })).map((d, i) => {
              const h = maxConn > 0 ? Math.max(6, Math.round((d.count / maxConn) * 68)) : 6
              const isToday = i === 6
              return (
                <div key={i} className="bar-col">
                  <span className="bar-val">{d.count > 0 ? d.count : ''}</span>
                  <div className="bar" style={{
                    height: h,
                    background: isToday
                      ? 'linear-gradient(180deg, #1AAFE6 0%, rgba(26,175,230,0.6) 100%)'
                      : '#f1f5f9',
                    boxShadow: isToday ? '0 2px 8px rgba(26,175,230,0.25)' : 'none',
                  }} />
                  <span className="bar-day">
                    {d.date ? new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }) : ''}
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ height: 12 }} />
        </div>

        {/* Comptes par rôle */}
        <div className="section-card">
          <div className="section-head">
            <div>
              <div className="section-title">Comptes par rôle</div>
              <div className="section-sub">{loading ? '—' : stats?.users_total ?? 0} utilisateurs</div>
            </div>
          </div>
          <div style={{ paddingTop: 6, paddingBottom: 6 }}>
            {loading
              ? Array(5).fill(0).map((_, i) => <div key={i} className="role-row"><div className="skel" style={{ height: 14, width: '70%' }} /></div>)
              : stats?.users_by_role.slice(0, 7).map(r => {
                  const color = ROLE_COLORS[r.role] ?? '#64748b'
                  const pct = stats.users_total > 0 ? Math.round((r.count / stats.users_total) * 100) : 0
                  return (
                    <div key={r.role} className="role-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>{r.role}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>{r.count}</span>
                      </div>
                      <div className="role-bar-track">
                        <div className="role-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>
      </div>


      <div style={{ height: '2rem' }} />
    </div>
  )
}
