'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, RotateCcw, Search, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const PAGE_SIZE = 20

interface Cycle { id: number; code: string; libelle: string; etablissement: number }
interface ApiList<T> { count: number; results: T[] }

const COLORS = ['#1AAFE6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#3b82f6','#ec4899']
function accent(id: number) { return COLORS[id % COLORS.length] }

function getMe() {
  try { return JSON.parse(localStorage.getItem('dc_user') || 'null') } catch { return null }
}

const STYLE = (
  <style>{`
    :root { --br: #e2e8f0; --bg: #f8fafc; }
    .sc-wrap { background:#fff; border:1px solid var(--br); border-radius:14px; overflow:hidden; }
    .sc-toolbar { display:flex; align-items:center; gap:.75rem; padding:.875rem 1.125rem; border-bottom:1px solid var(--br); flex-wrap:wrap; }
    .sc-search { display:flex; align-items:center; gap:.5rem; background:var(--bg); border:1px solid var(--br); border-radius:8px; padding:.45rem .75rem; flex:1; min-width:180px; max-width:320px; }
    .sc-search input { background:none; border:none; outline:none; font-size:.8125rem; color:#334155; width:100%; }
    .sc-search input::placeholder { color:#94a3b8; }
    .sc-table { width:100%; border-collapse:collapse; }
    .sc-table th { padding:.75rem 1.125rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid var(--br); background:var(--bg); white-space:nowrap; }
    .sc-table td { padding:.75rem 1.125rem; font-size:.8125rem; color:#334155; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .sc-table tr:last-child td { border-bottom:none; }
    .sc-table tr:hover td { background:#f8fafc; }
    .sc-avatar { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; color:#fff; flex-shrink:0; }
    .sc-row { display:flex; align-items:center; gap:.625rem; }
    .sc-primary { font-weight:600; color:#0f172a; }
    .sc-badge { display:inline-flex; align-items:center; padding:.25rem .625rem; border-radius:99px; font-size:.7rem; font-weight:700; white-space:nowrap; font-family:monospace; }
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
    .sc-add { display:inline-flex; align-items:center; gap:.375rem; background:#1AAFE6; color:#fff; border:none; border-radius:9px; padding:.5rem 1rem; font-size:.8125rem; font-weight:600; cursor:pointer; transition:background .15s; white-space:nowrap; }
    .sc-add:hover { background:#0d9ed4; }
    .sc-empty { padding:2.5rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
    .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub    { font-size:.75rem; color:#94a3b8; margin:.25rem 0 0; }
    .mo { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
    @media(min-width:640px){ .mo { align-items:center; } }
    .mo-box { background:#fff; border-radius:16px 16px 0 0; width:100%; max-width:440px; max-height:90vh; overflow-y:auto; display:flex; flex-direction:column; }
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
    .fl input { width:100%; border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem; font-size:.875rem; color:#334155; outline:none; transition:border .15s; background:#fff; }
    .fl input:focus { border-color:#1AAFE6; }
    .fl-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .btn-cancel { background:#f1f5f9; border:none; border-radius:9px; padding:.55rem 1.125rem; font-size:.875rem; font-weight:600; color:#475569; cursor:pointer; }
    .btn-cancel:hover { background:#e2e8f0; }
    .btn-save { background:#1AAFE6; border:none; border-radius:9px; padding:.55rem 1.25rem; font-size:.875rem; font-weight:600; color:#fff; cursor:pointer; }
    .btn-save:hover { background:#0d9ed4; }
    .btn-save:disabled { opacity:.6; cursor:not-allowed; }
    .err { background:#fef2f2; border:1px solid #fecaca; border-radius:9px; padding:.65rem .875rem; font-size:.8rem; color:#dc2626; }
  `}</style>
)

export default function CyclesPage() {
  const [list, setList]       = useState<Cycle[]>([])
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Cycle | null>(null)
  const [form, setForm]       = useState({ code: '', libelle: '' })
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState<string | null>(null)
  const [delTarget, setDelTarget] = useState<Cycle | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    apiFetch<ApiList<Cycle>>('/cycles/?limit=200')
      .then(r => setList(r.results))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(c => c.libelle.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [list, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditing(null); setForm({ code: '', libelle: '' }); setErr(null); setOpen(true)
  }
  function openEdit(c: Cycle) {
    setEditing(c); setForm({ code: c.code, libelle: c.libelle }); setErr(null); setOpen(true)
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault(); setSaving(true); setErr(null)
    try {
      const me = getMe()
      const body = { code: form.code.toUpperCase(), libelle: form.libelle, etablissement: me?.etablissement }
      if (editing) await apiFetch(`/cycles/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      else await apiFetch('/cycles/', { method: 'POST', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) {
      const r = e && typeof e === 'object' ? e as Record<string, unknown> : {}
      setErr(typeof r.detail === 'string' ? r.detail : Object.values(r).flat().join(' ') || 'Erreur')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!delTarget) return
    await apiFetch(`/cycles/${delTarget.id}/`, { method: 'DELETE' }).catch(console.error)
    setDelTarget(null); load()
  }

  return (
    <>
      {STYLE}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Cycles</h1>
          <p className="pg-sub">{loading ? '…' : `${filtered.length} cycle${filtered.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button className="sc-add" onClick={openAdd}><Plus size={14} /> Ajouter</button>
      </div>

      <div className="sc-wrap">
        <div className="sc-toolbar">
          <div className="sc-search">
            <Search size={13} color="#94a3b8" />
            <input placeholder="Rechercher un cycle…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="sc-table">
            <thead>
              <tr><th>Cycle</th><th>Code</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="sc-empty">Chargement…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={3} className="sc-empty">
                  <RotateCcw size={32} color="#e2e8f0" style={{ margin: '0 auto .5rem', display: 'block' }} />
                  Aucun cycle
                </td></tr>
              ) : paged.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="sc-row">
                      <div className="sc-avatar" style={{ background: accent(c.id) }}>
                        {c.code.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.libelle}</span>
                    </div>
                  </td>
                  <td>
                    <span className="sc-badge" style={{ background: `${accent(c.id)}1a`, color: accent(c.id) }}>{c.code}</span>
                  </td>
                  <td>
                    <div className="sc-actions">
                      <button className="sc-btn" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                      <button className="sc-btn del" onClick={() => setDelTarget(c)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="sc-footer">
            <span className="sc-count">{filtered.length} cycles · Page {page}/{totalPages}</span>
            <div className="sc-pager">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`sc-pg${page === p ? ' cur' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="mo-box">
            <div className="mo-head">
              <span className="mo-title">{editing ? 'Modifier le cycle' : 'Nouveau cycle'}</span>
              <button className="mo-x" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="mo-body">
                {err && <div className="err">{err}</div>}
                <div className="fl-grid2">
                  <div className="fl">
                    <label>Libellé <span>*</span></label>
                    <input required value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} placeholder="Licence" />
                  </div>
                  <div className="fl">
                    <label>Code <span>*</span></label>
                    <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="LIC" />
                  </div>
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
          <div className="mo-box" style={{ maxWidth: 380 }}>
            <div className="mo-head">
              <span className="mo-title">Supprimer le cycle</span>
              <button className="mo-x" onClick={() => setDelTarget(null)}><X size={16} /></button>
            </div>
            <div className="mo-body">
              <p style={{ fontSize: '.875rem', color: '#475569' }}>
                Supprimer le cycle <strong>{delTarget.libelle}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="mo-foot">
              <button className="btn-cancel" onClick={() => setDelTarget(null)}>Annuler</button>
              <button className="btn-save" style={{ background: '#ef4444' }} onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
