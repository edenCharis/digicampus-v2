'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, Layers, Search, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const PAGE_SIZE = 25

interface UE   { id: number; code: string; libelle: string; niveau: string; semestre: string }
interface ECUE {
  id: number; code: string; libelle: string; credits: number
  ue: number; ue_code: string; ue_libelle: string
}
interface ApiList<T> { count: number; results: T[] }

function emptyForm() { return { code: '', libelle: '', credits: '0', ue: '' } }

const STYLE = (
  <style>{`
    :root { --br: #e2e8f0; --bg: #f8fafc; }
    .sc-wrap { background:#fff; border:1px solid var(--br); border-radius:14px; overflow:hidden; }
    .sc-toolbar { display:flex; align-items:center; gap:.75rem; padding:.875rem 1.125rem; border-bottom:1px solid var(--br); flex-wrap:wrap; }
    .sc-search { display:flex; align-items:center; gap:.5rem; background:var(--bg); border:1px solid var(--br); border-radius:8px; padding:.45rem .75rem; flex:1; min-width:180px; max-width:320px; }
    .sc-search input { background:none; border:none; outline:none; font-size:.8125rem; color:#334155; width:100%; }
    .sc-search input::placeholder { color:#94a3b8; }
    .sc-sel { background:var(--bg); border:1px solid var(--br); border-radius:8px; padding:.45rem .75rem; font-size:.8125rem; color:#475569; cursor:pointer; outline:none; min-width:160px; max-width:280px; }
    .sc-sel:focus { border-color:#EF4444; }
    .sc-table { width:100%; border-collapse:collapse; }
    .sc-table th { padding:.75rem 1.125rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid var(--br); background:var(--bg); white-space:nowrap; }
    .sc-table td { padding:.75rem 1.125rem; font-size:.8125rem; color:#334155; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .sc-table tr:last-child td { border-bottom:none; }
    .sc-table tr:hover td { background:#f8fafc; }
    .sc-primary { font-weight:600; color:#0f172a; }
    .sc-sub { font-size:.75rem; color:#94a3b8; margin-top:1px; }
    .sc-mono { font-family:monospace; font-weight:700; font-size:.8125rem; color:#EF4444; }
    .sc-badge { display:inline-flex; align-items:center; padding:.25rem .625rem; border-radius:99px; font-size:.7rem; font-weight:700; white-space:nowrap; }
    .sc-actions { display:flex; align-items:center; gap:.25rem; }
    .sc-btn { padding:.35rem .5rem; border:none; background:none; border-radius:7px; cursor:pointer; color:#94a3b8; display:flex; align-items:center; transition:all .15s; }
    .sc-btn:hover { background:#f1f5f9; color:#475569; }
    .sc-btn.del:hover { background:rgba(239,68,68,0.08); color:#ef4444; }
    .sc-footer { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1.125rem; border-top:1px solid var(--br); }
    .sc-count { font-size:.75rem; color:#94a3b8; }
    .sc-pager { display:flex; gap:.25rem; }
    .sc-pg { padding:.35rem .6rem; border:1px solid var(--br); border-radius:7px; background:#fff; font-size:.75rem; cursor:pointer; color:#64748b; transition:all .15s; min-width:2rem; text-align:center; }
    .sc-pg:hover { background:#f8fafc; }
    .sc-pg.cur { background:#EF4444; color:#fff; border-color:#EF4444; font-weight:700; }
    .sc-pg.dot { border:none; background:none; cursor:default; color:#94a3b8; }
    .sc-add { display:inline-flex; align-items:center; gap:.375rem; background:#EF4444; color:#fff; border:none; border-radius:9px; padding:.5rem 1rem; font-size:.8125rem; font-weight:600; cursor:pointer; transition:background .15s; white-space:nowrap; }
    .sc-add:hover { background:#DC2626; }
    .sc-empty { padding:2.5rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
    .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub    { font-size:.75rem; color:#94a3b8; margin:.25rem 0 0; }
    .mo { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
    @media(min-width:640px){ .mo { align-items:center; } }
    .mo-box { background:#fff; border-radius:16px 16px 0 0; width:100%; max-width:480px; max-height:92vh; overflow-y:auto; display:flex; flex-direction:column; }
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
    .fl input:focus, .fl select:focus { border-color:#EF4444; }
    .fl-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .btn-cancel { background:#f1f5f9; border:none; border-radius:9px; padding:.55rem 1.125rem; font-size:.875rem; font-weight:600; color:#475569; cursor:pointer; }
    .btn-cancel:hover { background:#e2e8f0; }
    .btn-save { background:#EF4444; border:none; border-radius:9px; padding:.55rem 1.25rem; font-size:.875rem; font-weight:600; color:#fff; cursor:pointer; }
    .btn-save:hover { background:#DC2626; }
    .btn-save:disabled { opacity:.6; cursor:not-allowed; }
    .err { background:#fef2f2; border:1px solid #fecaca; border-radius:9px; padding:.65rem .875rem; font-size:.8rem; color:#dc2626; }
  `}</style>
)

export default function ECUEsPage() {
  const [all, setAll]         = useState<ECUE[]>([])
  const [ues, setUes]         = useState<UE[]>([])
  const [search, setSearch]   = useState('')
  const [filterUE, setFilterUE] = useState('')
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<ECUE | null>(null)
  const [form, setForm]       = useState<{ code: string; libelle: string; credits: string; ue: string }>(emptyForm())
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState<string | null>(null)
  const [delTarget, setDelTarget] = useState<ECUE | null>(null)
  const [deleting, setDeleting]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    apiFetch<ApiList<ECUE>>('/ecues/?limit=500')
      .then(r => setAll(r.results))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    apiFetch<ApiList<UE>>('/ues/?limit=300').then(r => setUes(r.results)).catch(console.error)
  }, [])

  const filtered = useMemo(() => {
    let r = all
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(e => e.code.toLowerCase().includes(q) || e.libelle.toLowerCase().includes(q))
    }
    if (filterUE) r = r.filter(e => e.ue === Number(filterUE))
    return r
  }, [all, search, filterUE])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditing(null)
    setForm({ ...emptyForm(), ue: filterUE || (ues[0]?.id.toString() ?? '') })
    setErr(null); setOpen(true)
  }
  function openEdit(e: ECUE) {
    setEditing(e)
    setForm({ code: e.code, libelle: e.libelle, credits: String(e.credits), ue: String(e.ue) })
    setErr(null); setOpen(true)
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault(); setSaving(true); setErr(null)
    try {
      const credits = Number(form.credits)
      const body = { code: form.code, libelle: form.libelle, credits, coefficient: credits, ue: Number(form.ue) }
      if (editing) await apiFetch(`/ecues/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      else await apiFetch('/ecues/', { method: 'POST', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) {
      const r = e && typeof e === 'object' ? e as Record<string, unknown> : {}
      const msgs: string[] = []
      for (const [k, v] of Object.entries(r)) {
        const label = k === 'non_field_errors' ? '' : `${k}: `
        msgs.push(`${label}${Array.isArray(v) ? v.join(', ') : String(v)}`)
      }
      setErr(msgs.join(' — ') || 'Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!delTarget) return
    setDeleting(true)
    try {
      await apiFetch(`/ecues/${delTarget.id}/`, { method: 'DELETE' })
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
          <h1 className="pg-title">Éléments Constitutifs d&apos;UE</h1>
          <p className="pg-sub">{loading ? '…' : `${filtered.length} ECUE${filtered.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button className="sc-add" onClick={openAdd}><Plus size={14} /> Ajouter un ECUE</button>
      </div>

      <div className="sc-wrap">
        <div className="sc-toolbar">
          <div className="sc-search">
            <Search size={13} color="#94a3b8" />
            <input placeholder="Code ou libellé…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="sc-sel" value={filterUE} onChange={e => { setFilterUE(e.target.value); setPage(1) }}>
            <option value="">Toutes les UEs</option>
            {ues.map(u => <option key={u.id} value={u.id}>{u.code} — {u.libelle}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="sc-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Libellé ECUE</th>
                <th>UE parente</th>
                <th>Crédits</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="sc-empty">Chargement…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={5} className="sc-empty">
                  <Layers size={32} color="#e2e8f0" style={{ margin: '0 auto .5rem', display: 'block' }} />
                  {filterUE ? 'Aucun ECUE pour cette UE' : 'Aucun ECUE'}
                </td></tr>
              ) : paged.map(ec => (
                <tr key={ec.id}>
                  <td><span className="sc-mono">{ec.code}</span></td>
                  <td><div className="sc-primary">{ec.libelle}</div></td>
                  <td>
                    <span className="sc-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                      {ec.ue_code}
                    </span>
                    <div className="sc-sub" style={{ marginTop: 3 }}>{ec.ue_libelle}</div>
                  </td>
                  <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{ec.credits}</td>
                  <td>
                    <div className="sc-actions">
                      <button className="sc-btn" onClick={() => openEdit(ec)} title="Modifier"><Pencil size={14} /></button>
                      <button className="sc-btn del" onClick={() => setDelTarget(ec)} title="Supprimer"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="sc-footer">
            <span className="sc-count">{filtered.length} ECUEs · Page {page}/{totalPages}</span>
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

      {open && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="mo-box">
            <div className="mo-head">
              <span className="mo-title">{editing ? 'Modifier l\'ECUE' : 'Nouvel ECUE'}</span>
              <button className="mo-x" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="mo-body">
                {err && <div className="err">{err}</div>}
                <div className="fl">
                  <label>UE parente <span>*</span></label>
                  <select required value={form.ue} onChange={e => setForm({ ...form, ue: e.target.value })}>
                    <option value="">— Choisir une UE —</option>
                    {ues.map(u => <option key={u.id} value={u.id}>{u.code} — {u.libelle} ({u.niveau} / {u.semestre})</option>)}
                  </select>
                </div>
                <div className="fl-grid2">
                  <div className="fl">
                    <label>Code ECUE <span>*</span></label>
                    <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="ECUE-01" />
                  </div>
                  <div className="fl">
                    <label>Libellé <span>*</span></label>
                    <input required value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} placeholder="Intitulé de l'élément" />
                  </div>
                </div>
                <div className="fl">
                  <label>Crédits</label>
                  <input type="number" min="0" step="0.5" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} />
                </div>
              </div>
              <div className="mo-foot">
                <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {delTarget && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setDelTarget(null)}>
          <div className="mo-box" style={{ maxWidth: 400 }}>
            <div className="mo-head">
              <span className="mo-title">Supprimer l&apos;ECUE</span>
              <button className="mo-x" onClick={() => setDelTarget(null)}><X size={16} /></button>
            </div>
            <div className="mo-body">
              <p style={{ fontSize: '.875rem', color: '#475569' }}>
                Supprimer l&apos;ECUE <strong>{delTarget.code} — {delTarget.libelle}</strong> ?
              </p>
            </div>
            <div className="mo-foot">
              <button className="btn-cancel" onClick={() => setDelTarget(null)}>Annuler</button>
              <button className="btn-save" style={{ background: '#ef4444' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
