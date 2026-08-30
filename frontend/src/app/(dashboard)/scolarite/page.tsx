'use client'
import { useEffect, useState, useMemo } from 'react'
import { Users, ClipboardList, BookOpen, LayoutGrid, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface NiveauRow { niveau: string; count: number }
interface RecentInsc {
  id: number; etudiant_nom: string; etudiant_code: string
  classe: string; type: string; paiement: boolean; date: string
}
interface SuiviPeriode {
  periode: string  // "2026-08" ou "2026-S2"
  paye: number; partiel: number; attente: number; total: number
}
interface Stats {
  etudiants: number; classes: number; ues: number; inscriptions: number
  annee_active: string | null
  inscriptions_nouveau: number; inscriptions_reinscrit: number; inscriptions_transfert: number
  suivi_mois: SuiviPeriode; suivi_semestre: SuiviPeriode
  etudiants_inscrit: number; etudiants_en_cours: number; etudiants_admis: number; etudiants_refuse: number
  niveaux: NiveauRow[]; recent_inscriptions: RecentInsc[]
}

const STYLE = (
  <style>{`
    .db { max-width: 1100px; margin: 0 auto; }

    /* Header */
    .db-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.75rem; flex-wrap:wrap; gap:.75rem; }
    .db-title { font-size:1.375rem; font-weight:800; color:#0f172a; letter-spacing:-.03em; margin:0; }
    .db-sub { font-size:.8125rem; color:#94a3b8; margin:.25rem 0 0; }
    .db-badge { display:inline-flex; align-items:center; gap:.4rem; background:rgba(26,175,230,0.1); color:#1AAFE6; border:1px solid rgba(26,175,230,0.2); border-radius:99px; padding:.35rem .875rem; font-size:.75rem; font-weight:700; white-space:nowrap; }
    .db-badge-dot { width:7px; height:7px; border-radius:50%; background:#1AAFE6; }

    /* KPI row */
    .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.25rem; }
    @media(max-width:900px){ .kpi-row { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:560px){ .kpi-row { grid-template-columns:1fr 1fr; } }

    .kpi { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.25rem 1.25rem 1rem; position:relative; overflow:hidden; }
    .kpi::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:99px 99px 0 0; }
    .kpi.blue::after { background:#1AAFE6; }
    .kpi.violet::after { background:#8b5cf6; }
    .kpi.green::after { background:#10b981; }
    .kpi.amber::after { background:#f59e0b; }
    .kpi-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:.875rem; }
    .kpi-val { font-size:2rem; font-weight:800; color:#0f172a; letter-spacing:-.04em; line-height:1; font-variant-numeric:tabular-nums; }
    .kpi-label { font-size:.75rem; font-weight:600; color:#64748b; margin-top:.375rem; }
    .kpi-sub { font-size:.7rem; color:#94a3b8; margin-top:.25rem; }
    .kpi-skel { background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; height:2rem; width:60%; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Middle grid */
    .mid-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; margin-bottom:1.25rem; }
    @media(max-width:900px){ .mid-row { grid-template-columns:1fr 1fr; } }
    @media(max-width:560px){ .mid-row { grid-template-columns:1fr; } }

    .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.125rem 1.25rem; }
    .card-title { font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; margin-bottom:1rem; }

    /* Bar chart */
    .bar-item { display:flex; align-items:center; gap:.625rem; margin-bottom:.625rem; }
    .bar-item:last-child { margin-bottom:0; }
    .bar-label { font-size:.775rem; color:#475569; min-width:90px; flex-shrink:0; }
    .bar-track { flex:1; height:7px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
    .bar-fill { height:100%; border-radius:99px; transition:width .5s ease; }
    .bar-count { font-size:.75rem; font-weight:700; color:#475569; min-width:28px; text-align:right; font-variant-numeric:tabular-nums; }

    /* Suivi mensuel */
    .suivi-tabs { display:flex; gap:.375rem; margin-bottom:1rem; }
    .suivi-tab { flex:1; padding:.375rem .5rem; border:1px solid #e2e8f0; border-radius:7px; font-size:.72rem; font-weight:600; cursor:pointer; background:#f8fafc; color:#64748b; text-align:center; transition:all .15s; }
    .suivi-tab.active { background:#1AAFE6; color:#fff; border-color:#1AAFE6; }
    .suivi-stat { display:flex; align-items:center; gap:.625rem; padding:.5rem 0; border-bottom:1px solid #f1f5f9; }
    .suivi-stat:last-child { border-bottom:none; }
    .suivi-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .suivi-lbl { font-size:.8rem; color:#475569; flex:1; }
    .suivi-n { font-size:.875rem; font-weight:700; color:#0f172a; font-variant-numeric:tabular-nums; }
    .suivi-pct { font-size:.7rem; color:#94a3b8; margin-left:.25rem; }

    /* Donut-style ring (CSS only) */
    .ring-wrap { display:flex; align-items:center; gap:1rem; }
    .ring-svg { flex-shrink:0; }
    .ring-legend { display:flex; flex-direction:column; gap:.4rem; flex:1; }
    .leg-row { display:flex; align-items:center; gap:.5rem; font-size:.775rem; color:#475569; }
    .leg-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
    .leg-val { margin-left:auto; font-weight:700; color:#0f172a; font-variant-numeric:tabular-nums; }

    /* Recent inscriptions */
    .rec-row { display:flex; align-items:center; gap:.75rem; padding:.5rem 0; border-bottom:1px solid #f1f5f9; }
    .rec-row:last-child { border-bottom:none; }
    .rec-av { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.68rem; font-weight:700; color:#fff; flex-shrink:0; }
    .rec-name { font-size:.8125rem; font-weight:600; color:#0f172a; }
    .rec-sub { font-size:.72rem; color:#94a3b8; margin-top:1px; }
    .rec-badge { display:inline-flex; align-items:center; padding:.2rem .5rem; border-radius:99px; font-size:.68rem; font-weight:700; white-space:nowrap; }
    .rec-pay { display:flex; align-items:center; gap:.3rem; font-size:.72rem; margin-left:auto; flex-shrink:0; }

    /* Bottom grid */
    .bot-row { display:grid; grid-template-columns:2fr 1fr; gap:1rem; }
    @media(max-width:768px){ .bot-row { grid-template-columns:1fr; } }

    /* Niveau bars */
    .niv-bar { display:flex; align-items:center; gap:.75rem; margin-bottom:.75rem; }
    .niv-bar:last-child { margin-bottom:0; }
    .niv-code { font-size:.75rem; font-weight:700; min-width:28px; text-align:center; padding:.15rem .4rem; border-radius:6px; }
    .niv-track { flex:1; height:10px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
    .niv-fill { height:100%; border-radius:99px; }
    .niv-n { font-size:.75rem; font-weight:700; color:#475569; min-width:20px; text-align:right; font-variant-numeric:tabular-nums; }
  `}</style>
)

const COLORS = ['#1AAFE6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#3b82f6','#ec4899']
function av(nom: string) { return COLORS[nom.charCodeAt(0) % COLORS.length] }

const NIVEAU_C: Record<string, { bg: string; color: string }> = {
  L1:{bg:'rgba(26,175,230,.15)',color:'#1AAFE6'},
  L2:{bg:'rgba(14,165,233,.15)',color:'#0ea5e9'},
  L3:{bg:'rgba(6,182,212,.15)',color:'#06b6d4'},
  M1:{bg:'rgba(139,92,246,.15)',color:'#8b5cf6'},
  M2:{bg:'rgba(124,58,237,.15)',color:'#7c3aed'},
  D1:{bg:'rgba(245,158,11,.15)',color:'#f59e0b'},
  D2:{bg:'rgba(217,119,6,.15)',color:'#d97706'},
  D3:{bg:'rgba(180,83,9,.15)',color:'#b45309'},
}

function DonutRing({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p style={{ fontSize: '.8rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>Aucune donnée</p>

  const r = 40, cx = 50, cy = 50
  const circ = 2 * Math.PI * r
  let offset = 0
  const slices = data.map(d => {
    const pct = total > 0 ? d.value / total : 0
    const dash = pct * circ
    const s = { offset, dash, color: d.color, label: d.label, value: d.value }
    offset += dash
    return s
  })

  return (
    <div className="ring-wrap">
      <svg className="ring-svg" viewBox="0 0 100 100" width={80} height={80}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={12} />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={12}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset + circ / 4}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        ))}
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: '14px', fontWeight: 800, fill: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{total}</text>
      </svg>
      <div className="ring-legend">
        {data.map(d => (
          <div key={d.label} className="leg-row">
            <div className="leg-dot" style={{ background: d.color }} />
            <span>{d.label}</span>
            <span className="leg-val">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ items, color }: { items: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...items.map(i => i.value), 1)
  return (
    <div>
      {items.map(i => (
        <div key={i.label} className="bar-item">
          <span className="bar-label">{i.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(i.value / max) * 100}%`, background: color }} />
          </div>
          <span className="bar-count">{i.value}</span>
        </div>
      ))}
    </div>
  )
}

function fmt(n: number | undefined, loading: boolean) {
  if (loading) return null
  return (n ?? 0).toLocaleString('fr-FR')
}

export default function ScolariteDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Stats>('/stats/').then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('dc_user') || 'null') } catch { return null }
  }, [])

  const s = stats
  const [suiviMode, setSuiviMode] = useState<'mois' | 'semestre'>('mois')

  const suivi: SuiviPeriode | undefined = suiviMode === 'mois' ? s?.suivi_mois : s?.suivi_semestre
  const suiviPct = suivi && suivi.total > 0 ? Math.round((suivi.paye / suivi.total) * 100) : 0
  const suiviNonPayes = suivi ? Math.max(0, suivi.total - suivi.paye - suivi.partiel - suivi.attente) : 0

  function formatPeriode(p: string | undefined) {
    if (!p) return ''
    if (p.includes('-S')) {
      const [y, s] = p.split('-')
      return `Semestre ${s.replace('S', '')} · ${y}`
    }
    const [y, m] = p.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }

  return (
    <>
      {STYLE}
      <div className="db">

        {/* Header */}
        <div className="db-head">
          <div>
            <h1 className="db-title">Bonjour{me?.nom ? `, ${me.nom.split(' ')[0]}` : ''} 👋</h1>
            <p className="db-sub">Tableau de bord scolarité · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          {s?.annee_active && (
            <div className="db-badge">
              <span className="db-badge-dot" />
              Année active : {s.annee_active}
            </div>
          )}
        </div>

        {/* KPI cards */}
        <div className="kpi-row">
          {[
            { label: 'Inscriptions', sub: s?.annee_active ?? 'Aucune année active', val: fmt(s?.inscriptions, loading), color: 'blue', icon: <ClipboardList size={18} color="#1AAFE6" />, iconBg: 'rgba(26,175,230,0.1)' },
            { label: 'Étudiants', sub: `${fmt(s?.etudiants_inscrit, loading)} inscrits actifs`, val: fmt(s?.etudiants, loading), color: 'violet', icon: <Users size={18} color="#8b5cf6" />, iconBg: 'rgba(139,92,246,0.1)' },
            { label: 'Classes', sub: `${(s?.niveaux ?? []).length} niveaux actifs`, val: fmt(s?.classes, loading), color: 'green', icon: <LayoutGrid size={18} color="#10b981" />, iconBg: 'rgba(16,185,129,0.1)' },
            { label: 'Unités d\'enseignement', sub: 'UE configurées', val: fmt(s?.ues, loading), color: 'amber', icon: <BookOpen size={18} color="#f59e0b" />, iconBg: 'rgba(245,158,11,0.1)' },
          ].map(k => (
            <div key={k.label} className={`kpi ${k.color}`}>
              <div className="kpi-icon" style={{ background: k.iconBg }}>{k.icon}</div>
              {loading
                ? <div className="kpi-skel" />
                : <div className="kpi-val">{k.val}</div>
              }
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Middle row */}
        <div className="mid-row">

          {/* Statuts étudiants */}
          <div className="card">
            <div className="card-title">Statuts étudiants</div>
            <DonutRing data={[
              { label: 'Inscrits',  value: s?.etudiants_inscrit  ?? 0, color: '#10b981' },
              { label: 'En cours', value: s?.etudiants_en_cours  ?? 0, color: '#f59e0b' },
              { label: 'Admis',    value: s?.etudiants_admis     ?? 0, color: '#1AAFE6' },
              { label: 'Refusés',  value: s?.etudiants_refuse    ?? 0, color: '#ef4444' },
            ]} />
          </div>

          {/* Types d'inscriptions */}
          <div className="card">
            <div className="card-title">Types d&apos;inscriptions</div>
            <BarChart color="#1AAFE6" items={[
              { label: 'Nouveaux',     value: s?.inscriptions_nouveau   ?? 0 },
              { label: 'Réinscrits',   value: s?.inscriptions_reinscrit ?? 0 },
              { label: 'Transferts',   value: s?.inscriptions_transfert ?? 0 },
            ]} />
          </div>

          {/* Suivi frais scolarité — dynamique par période */}
          <div className="card">
            <div className="card-title">Suivi des frais</div>
            <div className="suivi-tabs">
              <button className={`suivi-tab${suiviMode === 'mois' ? ' active' : ''}`} onClick={() => setSuiviMode('mois')}>Ce mois</button>
              <button className={`suivi-tab${suiviMode === 'semestre' ? ' active' : ''}`} onClick={() => setSuiviMode('semestre')}>Semestre</button>
            </div>
            <p style={{ fontSize: '.72rem', color: '#94a3b8', marginBottom: '.75rem' }}>
              {loading ? 'Chargement…' : formatPeriode(suivi?.periode)}
            </p>
            {/* Progress bar */}
            <div style={{ marginBottom: '.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.375rem' }}>
                <span style={{ fontSize: '.775rem', color: '#475569' }}>Taux à jour</span>
                <span style={{ fontSize: '.775rem', fontWeight: 700, color: '#10b981' }}>{loading ? '—' : `${suiviPct}%`}</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${suiviPct}%`, background: '#10b981', borderRadius: 99, transition: 'width .6s ease' }} />
              </div>
            </div>
            {[
              { label: 'À jour',       n: suivi?.paye    ?? 0, color: '#10b981' },
              { label: 'Partiel',      n: suivi?.partiel ?? 0, color: '#f59e0b' },
              { label: 'En attente',   n: suivi?.attente ?? 0, color: '#ef4444' },
              { label: 'Sans données', n: suiviNonPayes,       color: '#cbd5e1' },
            ].map(row => (
              <div key={row.label} className="suivi-stat">
                <div className="suivi-dot" style={{ background: row.color }} />
                <span className="suivi-lbl">{row.label}</span>
                <span className="suivi-n">{loading ? '—' : row.n}</span>
                {!loading && suivi && suivi.total > 0 && (
                  <span className="suivi-pct">({Math.round((row.n / suivi.total) * 100)}%)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="bot-row">

          {/* Recent inscriptions */}
          <div className="card">
            <div className="card-title">Dernières inscriptions</div>
            {loading && <p style={{ fontSize: '.8rem', color: '#94a3b8' }}>Chargement…</p>}
            {!loading && (s?.recent_inscriptions ?? []).length === 0 && (
              <p style={{ fontSize: '.8rem', color: '#94a3b8', padding: '1rem 0', textAlign: 'center' }}>Aucune inscription pour l&apos;année active</p>
            )}
            {(s?.recent_inscriptions ?? []).map(r => {
              const typeC: Record<string, { bg: string; color: string }> = {
                nouveau:   { bg: 'rgba(26,175,230,0.1)',  color: '#1AAFE6' },
                reinscrit: { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
                transfert: { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
              }
              const tc = typeC[r.type] ?? { bg: '#f1f5f9', color: '#64748b' }
              return (
                <div key={r.id} className="rec-row">
                  <div className="rec-av" style={{ background: av(r.etudiant_nom) }}>
                    {r.etudiant_nom.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="rec-name">{r.etudiant_nom}</div>
                    <div className="rec-sub">{r.classe} · <span style={{ fontFamily: 'monospace', fontSize: '.7rem' }}>{r.etudiant_code}</span></div>
                  </div>
                  <span className="rec-badge" style={{ background: tc.bg, color: tc.color }}>
                    {r.type === 'nouveau' ? 'Nouveau' : r.type === 'reinscrit' ? 'Réinscrit' : 'Transfert'}
                  </span>
                  <div className="rec-pay">
                    {r.paiement
                      ? <CheckCircle2 size={14} color="#10b981" />
                      : <Clock size={14} color="#f59e0b" />
                    }
                  </div>
                </div>
              )
            })}
          </div>

          {/* Classes par niveau */}
          <div className="card">
            <div className="card-title">Classes par niveau</div>
            {loading && <p style={{ fontSize: '.8rem', color: '#94a3b8' }}>Chargement…</p>}
            {!loading && (s?.niveaux ?? []).length === 0 && (
              <p style={{ fontSize: '.8rem', color: '#94a3b8', padding: '1rem 0', textAlign: 'center' }}>Aucune classe</p>
            )}
            {(s?.niveaux ?? []).map(n => {
              const max = Math.max(...(s?.niveaux ?? []).map(x => x.count), 1)
              const nc = NIVEAU_C[n.niveau] ?? { bg: '#f1f5f9', color: '#64748b' }
              return (
                <div key={n.niveau} className="niv-bar">
                  <span className="niv-code" style={{ background: nc.bg, color: nc.color }}>{n.niveau}</span>
                  <div className="niv-track">
                    <div className="niv-fill" style={{ width: `${(n.count / max) * 100}%`, background: nc.color }} />
                  </div>
                  <span className="niv-n">{n.count}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </>
  )
}
