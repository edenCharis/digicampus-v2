'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, BookOpen, Search, X, PlusCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const PAGE_SIZE = 20

interface Specialite { id: number; libelle: string; code: string }
interface ECUE { id?: number; code: string; libelle: string; credits: number; coefficient: number; ue?: number }
interface UE {
  id: number; code: string; libelle: string; semestre: string; niveau: string
  credits: number; specialite: number; specialite_libelle: string; etablissement: number; ecues: ECUE[]
}
interface ApiList<T> { count: number; results: T[] }

const NIVEAUX  = ['L1','L2','L3','M1','M2','D1','D2','D3']
const SEMESTRES = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10']

const NIV_COLORS: Record<string, { bg: string; color: string }> = {
  L1:{bg:'rgba(26,175,230,0.1)',color:'#1AAFE6'},  L2:{bg:'rgba(14,165,233,0.1)',color:'#0ea5e9'},
  L3:{bg:'rgba(6,182,212,0.1)',color:'#06b6d4'},   M1:{bg:'rgba(139,92,246,0.1)',color:'#8b5cf6'},
  M2:{bg:'rgba(124,58,237,0.1)',color:'#7c3aed'},  D1:{bg:'rgba(245,158,11,0.1)',color:'#f59e0b'},
  D2:{bg:'rgba(217,119,6,0.1)',color:'#d97706'},   D3:{bg:'rgba(180,83,9,0.1)',color:'#b45309'},
}
const SEM_COLORS: Record<string, string> = {
  S1:'#1AAFE6',S2:'#0ea5e9',S3:'#8b5cf6',S4:'#7c3aed',S5:'#22c55e',
  S6:'#10b981',S7:'#f59e0b',S8:'#ef4444',S9:'#f97316',S10:'#a855f7',
}

function emptyEcue(): ECUE { return { code: '', libelle: '', credits: 0, coefficient: 1 } }

const STYLE = (
  <style>{`
    :root { --br: #e2e8f0; --bg: #f8fafc; }
    .sc-wrap { background:#fff; border:1px solid var(--br); border-radius:14px; overflow:hidden; }
    .sc-toolbar { display:flex; align-items:center; gap:.75rem; padding:.875rem 1.125rem; border-bottom:1px solid var(--br); flex-wrap:wrap; }
    .sc-search { display:flex; align-items:center; gap:.5rem; background:var(--bg); border:1px solid var(--br); border-radius:8px; padding:.45rem .75rem; flex:1; min-width:180px; max-width:320px; }
    .sc-search input { background:none; border:none; outline:none; font-size:.8125rem; color:#334155; width:100%; }
    .sc-search input::placeholder { color:#94a3b8; }
    .sc-sel { background:var(--bg); border:1px solid var(--br); border-radius:8px; padding:.45rem .75rem; font-size:.8125rem; color:#475569; cursor:pointer; outline:none; }
    .sc-sel:focus { border-color:#1AAFE6; }
    .sc-table { width:100%; border-collapse:collapse; }
    .sc-table th { padding:.75rem 1.125rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid var(--br); background:var(--bg); white-space:nowrap; }
    .sc-table td { padding:.75rem 1.125rem; font-size:.8125rem; color:#334155; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .sc-table tr:last-child td { border-bottom:none; }
    .sc-table tr:hover td { background:#f8fafc; }
    .sc-primary { font-weight:600; color:#0f172a; }
    .sc-sub { font-size:.75rem; color:#94a3b8; margin-top:1px; }
    .sc-badge { display:inline-flex; align-items:center; padding:.25rem .625rem; border-radius:99px; font-size:.7rem; font-weight:700; white-space:nowrap; }
    .sc-mono { font-family:monospace; font-weight:700; font-size:.8125rem; color:#1AAFE6; }
    .sc-actions { display:flex; align-items:center; gap:.25rem; }
    .sc-btn { padding:.35rem .5rem; border:none; background:none; border-radius:7px; cursor:pointer; color:#94a3b8; display:flex; align-items:center; transition:all .15s; }
    .sc-btn:hover { background:#f1f5f9; color:#475569; }
    .sc-btn.del:hover { background:rgba(239,68,68,0.08); color:#ef4444; }
    .sc-footer { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1.125rem; border-top:1px solid var(--br); }
    .sc-count { font-size:.75rem; color:#94a3b8; }
    .sc-pager { display:flex; gap:.25rem; }
    .sc-pg { padding:.35rem .6rem; border:1px solid var(--br); border-radius:7px; background:#fff; font-size:.75rem; cursor:pointer; color:#64748b; transition:all .15s; min-width:2rem; text-align:center; }
    .sc-pg:hover { background:#f8fafc; }
    .sc-pg.cur { background:#1AAFE6; color:#fff; border-color:#1AAFE6; font-weight:700; }
    .sc-pg.dot { border:none; background:none; cursor:default; color:#94a3b8; }
    .sc-add { display:inline-flex; align-items:center; gap:.375rem; background:#1AAFE6; color:#fff; border:none; border-radius:9px; padding:.5rem 1rem; font-size:.8125rem; font-weight:600; cursor:pointer; transition:background .15s; white-space:nowrap; }
    .sc-add:hover { background:#0d9ed4; }
    .sc-empty { padding:2.5rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
    .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub    { font-size:.75rem; color:#94a3b8; margin:.25rem 0 0; }
    .mo { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
    @media(min-width:640px){ .mo { align-items:center; } }
    .mo-box { background:#fff; border-radius:16px 16px 0 0; width:100%; max-width:600px; max-height:92vh; overflow-y:auto; display:flex; flex-direction:column; }
    @media(min-width:640px){ .mo-box { border-radius:16px; } }
    .mo-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem 1rem; border-bottom:1px solid #f1f5f9; flex-shrink:0; }
    .mo-title { font-size:1rem; font-weight:700; color:#0f172a; }
    .mo-x { background:none; border:none; cursor:pointer; color:#94a3b8; padding:4px; border-radius:7px; }
    .mo-x:hover { background:#f1f5f9; color:#475569; }
    .mo-body { padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:.875rem; flex:1; }
    .mo-foot { display:flex; justify-content:flex-end; gap:.5rem; padding:1rem 1.5rem; border-top:1px solid #f1f5f9; flex-shrink:0; }
    .fl { display:flex; flex-direction:column; gap:.375rem; }
    .fl label { font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; }
    .fl label span { color:#ef4444; margin-left:2px; }
    .fl input, .fl select { width:100%; border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem; font-size:.875rem; color:#334155; outline:none; transition:border .15s; background:#fff; }
    .fl input:focus, .fl select:focus { border-color:#1AAFE6; }
    .fl-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .fl-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.875rem; }
    .mo-section { font-size:.65rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.1em; padding:.125rem 0; border-bottom:1px solid #f1f5f9; margin-bottom:.125rem; }
    .btn-cancel { background:#f1f5f9; border:none; border-radius:9px; padding:.55rem 1.125rem; font-size:.875rem; font-weight:600; color:#475569; cursor:pointer; }
    .btn-cancel:hover { background:#e2e8f0; }
    .btn-save { background:#1AAFE6; border:none; border-radius:9px; padding:.55rem 1.25rem; font-size:.875rem; font-weight:600; color:#fff; cursor:pointer; }
    .btn-save:hover { background:#0d9ed4; }
    .btn-save:disabled { opacity:.6; cursor:not-allowed; }
    .err { background:#fef2f2; border:1px solid #fecaca; border-radius:9px; padding:.65rem .875rem; font-size:.8rem; color:#dc2626; }

    /* ECUEs inline table */
    .ecue-table { width:100%; border-collapse:collapse; margin-top:.25rem; }
    .ecue-table th { font-size:.68rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; padding:.4rem .5rem; text-align:left; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
    .ecue-table td { padding:.3rem .5rem; vertical-align:middle; }
    .ecue-table input { border:1px solid #e2e8f0; border-radius:6px; padding:.3rem .5rem; font-size:.8rem; width:100%; outline:none; background:#fff; }
    .ecue-table input:focus { border-color:#1AAFE6; }
    .ecue-add-btn { display:inline-flex; align-items:center; gap:.3rem; font-size:.75rem; color:#1AAFE6; background:none; border:none; cursor:pointer; padding:.25rem 0; font-weight:600; }
    .ecue-del { background:none; border:none; cursor:pointer; color:#cbd5e1; padding:2px 4px; border-radius:5px; }
    .ecue-del:hover { color:#ef4444; background:rgba(239,68,68,0.08); }
    .ecue-chip { display:inline-flex; align-items:center; padding:.15rem .45rem; border-radius:6px; font-size:.7rem; font-weight:700; background:rgba(26,175,230,0.1); color:#1AAFE6; margin:.1rem; }
  `}</style>
)

export default function UEsPage() {
  const [all, setAll]             = useState<UE[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [search, setSearch]       = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [filterSpec, setFilterSpec] = useState('')
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [open, setOpen]           = useState(false)
  const [editTarget, setEditTarget] = useState<UE | null>(null)
  const [form, setForm]           = useState({ code: '', libelle: '', niveau: 'L1', semestre: 'S1', credits: '', specialite: '' })
  const [ecues, setEcues]         = useState<ECUE[]>([emptyEcue()])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [delTarget, setDelTarget] = useState<UE | null>(null)
  const [deleting, setDeleting]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    apiFetch<ApiList<UE>>('/ues/?limit=500')
      .then(r => setAll(r.results))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    apiFetch<ApiList<Specialite>>('/specialites/?limit=200')
      .then(r => setSpecialites(r.results)).catch(console.error)
  }, [])

  const filtered = useMemo(() => {
    let r = all
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(u => u.code.toLowerCase().includes(q) || u.libelle.toLowerCase().includes(q))
    }
    if (filterNiveau) r = r.filter(u => u.niveau === filterNiveau)
    if (filterSem)    r = r.filter(u => u.semestre === filterSem)
    if (filterSpec)   r = r.filter(u => u.specialite === Number(filterSpec))
    return r
  }, [all, search, filterNiveau, filterSem, filterSpec])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditTarget(null)
    setForm({ code: '', libelle: '', niveau: 'L1', semestre: 'S1', credits: '', specialite: specialites[0]?.id.toString() ?? '' })
    setEcues([emptyEcue()]); setError(null); setOpen(true)
  }
  function openEdit(ue: UE) {
    setEditTarget(ue)
    setForm({ code: ue.code, libelle: ue.libelle, niveau: ue.niveau, semestre: ue.semestre, credits: ue.credits.toString(), specialite: ue.specialite.toString() })
    setEcues(ue.ecues.length > 0 ? ue.ecues.map(e => ({ ...e })) : [emptyEcue()])
    setError(null); setOpen(true)
  }

  function updateEcue(idx: number, field: keyof ECUE, val: string) {
    setEcues(prev => prev.map((e, i) => i === idx
      ? { ...e, [field]: field === 'credits' || field === 'coefficient' ? Number(val) : val }
      : e
    ))
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault(); setSaving(true); setError(null)
    try {
      const user = JSON.parse(localStorage.getItem('dc_user') ?? '{}')
      const ueBody = {
        code: form.code, libelle: form.libelle, niveau: form.niveau,
        semestre: form.semestre, credits: Number(form.credits) || 0,
        specialite: Number(form.specialite), etablissement: user.etablissement,
      }
      let ueId: number
      if (editTarget) {
        const updated = await apiFetch<UE>(`/ues/${editTarget.id}/`, { method: 'PATCH', body: JSON.stringify(ueBody) })
        ueId = updated.id
      } else {
        const created = await apiFetch<UE>('/ues/', { method: 'POST', body: JSON.stringify(ueBody) })
        ueId = created.id
      }
      const validEcues = ecues.filter(ec => ec.code.trim() && ec.libelle.trim())
      for (const ec of validEcues) {
        const ecueBody = { code: ec.code, libelle: ec.libelle, credits: ec.credits, coefficient: ec.coefficient, ue: ueId }
        if (ec.id) await apiFetch(`/ecues/${ec.id}/`, { method: 'PATCH', body: JSON.stringify(ecueBody) })
        else await apiFetch('/ecues/', { method: 'POST', body: JSON.stringify(ecueBody) })
      }
      setOpen(false); load()
    } catch (err: unknown) {
      const e = err as Record<string, unknown>
      const msgs: string[] = []
      for (const [k, v] of Object.entries(e)) {
        const label = k === 'non_field_errors' ? '' : `${k}: `
        const values = Array.isArray(v) ? v.join(', ') : String(v)
        msgs.push(`${label}${values}`)
      }
      setError(msgs.join(' — ') || 'Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!delTarget) return
    setDeleting(true)
    try {
      await apiFetch(`/ues/${delTarget.id}/`, { method: 'DELETE' })
      setDelTarget(null); load()
    } catch { setDeleting(false) }
  }

  function pagerPages(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const arr: (number | '…')[] = [1]
    if (page > 3) arr.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) arr.push(i)
    if (page < totalPages - 2) arr.push('…')
    arr.push(totalPages)
    return arr
  }

  return (
    <>
      {STYLE}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Unités d&apos;Enseignement</h1>
          <p className="pg-sub">{loading ? '…' : `${filtered.length} UE${filtered.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button className="sc-add" onClick={openAdd}><Plus size={14} /> Ajouter une UE</button>
      </div>

      <div className="sc-wrap">
        <div className="sc-toolbar">
          <div className="sc-search">
            <Search size={13} color="#94a3b8" />
            <input placeholder="Code ou libellé…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="sc-sel" value={filterNiveau} onChange={e => { setFilterNiveau(e.target.value); setPage(1) }}>
            <option value="">Tous niveaux</option>
            {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select className="sc-sel" value={filterSem} onChange={e => { setFilterSem(e.target.value); setPage(1) }}>
            <option value="">Tous semestres</option>
            {SEMESTRES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="sc-sel" value={filterSpec} onChange={e => { setFilterSpec(e.target.value); setPage(1) }}>
            <option value="">Toutes spécialités</option>
            {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="sc-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Libellé UE</th>
                <th>Sem.</th>
                <th>Niveau</th>
                <th>Crédits</th>
                <th>ECUEs</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="sc-empty">Chargement…</td></tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sc-empty">
                    <BookOpen size={36} color="#e2e8f0" style={{ margin: '0 auto .5rem', display: 'block' }} />
                    Aucune UE trouvée
                  </td>
                </tr>
              ) : paged.map(ue => {
                const nc = NIV_COLORS[ue.niveau] ?? { bg: '#f1f5f9', color: '#64748b' }
                const sc = SEM_COLORS[ue.semestre] ?? '#64748b'
                return (
                  <tr key={ue.id}>
                    <td><span className="sc-mono">{ue.code}</span></td>
                    <td>
                      <div className="sc-primary">{ue.libelle}</div>
                      <div className="sc-sub">{ue.specialite_libelle}</div>
                    </td>
                    <td>
                      <span className="sc-badge" style={{ background: `${sc}1a`, color: sc }}>{ue.semestre}</span>
                    </td>
                    <td>
                      <span className="sc-badge" style={{ background: nc.bg, color: nc.color }}>{ue.niveau}</span>
                    </td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{ue.credits}</td>
                    <td>
                      {ue.ecues.length > 0
                        ? <div>{ue.ecues.map(ec => <span key={ec.id} className="ecue-chip">{ec.code}</span>)}</div>
                        : <span style={{ color: '#cbd5e1', fontSize: '.8rem' }}>—</span>
                      }
                    </td>
                    <td>
                      <div className="sc-actions">
                        <button className="sc-btn" onClick={() => openEdit(ue)} title="Modifier"><Pencil size={14} /></button>
                        <button className="sc-btn del" onClick={() => setDelTarget(ue)} title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="sc-footer">
            <span className="sc-count">{filtered.length} UE{filtered.length !== 1 ? 's' : ''} · Page {page}/{totalPages}</span>
            <div className="sc-pager">
              {pagerPages().map((p, i) =>
                p === '…'
                  ? <span key={i} className="sc-pg dot">…</span>
                  : <button key={p} className={`sc-pg${page === p ? ' cur' : ''}`} onClick={() => setPage(p as number)}>{p}</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {open && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="mo-box">
            <div className="mo-head">
              <span className="mo-title">{editTarget ? 'Modifier l\'UE' : 'Nouvelle UE'}</span>
              <button className="mo-x" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="mo-body">
                {error && <div className="err">{error}</div>}

                <div className="mo-section">Unité d&apos;enseignement</div>
                <div className="fl-grid2">
                  <div className="fl">
                    <label>Code UE <span>*</span></label>
                    <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="UE-INFO-101" />
                  </div>
                  <div className="fl">
                    <label>Crédits</label>
                    <input type="number" min="0" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} placeholder="3" />
                  </div>
                </div>
                <div className="fl">
                  <label>Libellé <span>*</span></label>
                  <input required value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} placeholder="Algorithmique et Structures de Données" />
                </div>
                <div className="fl-grid3">
                  <div className="fl">
                    <label>Niveau <span>*</span></label>
                    <select value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                      {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="fl">
                    <label>Semestre <span>*</span></label>
                    <select value={form.semestre} onChange={e => setForm({ ...form, semestre: e.target.value })}>
                      {SEMESTRES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="fl">
                    <label>Spécialité <span>*</span></label>
                    <select required value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })}>
                      <option value="">— choisir —</option>
                      {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mo-section">Éléments constitutifs (ECUEs)</div>
                <table className="ecue-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th style={{ width: '45%' }}>Libellé</th>
                      <th>Crédits</th>
                      <th>Coef.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecues.map((ec, idx) => (
                      <tr key={idx}>
                        <td><input value={ec.code} onChange={e => updateEcue(idx, 'code', e.target.value)} placeholder="ECUE-01" /></td>
                        <td><input value={ec.libelle} onChange={e => updateEcue(idx, 'libelle', e.target.value)} placeholder="Intitulé de l'ECUE" /></td>
                        <td><input type="number" min="0" step="0.5" value={ec.credits} onChange={e => updateEcue(idx, 'credits', e.target.value)} /></td>
                        <td><input type="number" min="0" step="0.5" value={ec.coefficient} onChange={e => updateEcue(idx, 'coefficient', e.target.value)} /></td>
                        <td>
                          {ecues.length > 1 && (
                            <button type="button" className="ecue-del"
                              onClick={() => setEcues(prev => prev.filter((_, i) => i !== idx))}>
                              <X size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className="ecue-add-btn"
                  onClick={() => setEcues(prev => [...prev, emptyEcue()])}>
                  <PlusCircle size={13} /> Ajouter un ECUE
                </button>
              </div>
              <div className="mo-foot">
                <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delTarget && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setDelTarget(null)}>
          <div className="mo-box" style={{ maxWidth: 400 }}>
            <div className="mo-head">
              <span className="mo-title">Supprimer l&apos;UE</span>
              <button className="mo-x" onClick={() => setDelTarget(null)}><X size={16} /></button>
            </div>
            <div className="mo-body">
              <p style={{ fontSize: '.875rem', color: '#475569' }}>
                Supprimer l&apos;UE <strong>{delTarget.code} — {delTarget.libelle}</strong> ?
                Tous ses ECUEs seront également supprimés.
              </p>
            </div>
            <div className="mo-foot">
              <button className="btn-cancel" onClick={() => setDelTarget(null)}>Annuler</button>
              <button className="btn-save" style={{ background: '#ef4444' }}
                onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
