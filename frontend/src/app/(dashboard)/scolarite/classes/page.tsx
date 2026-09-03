'use client'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Plus, Pencil, Trash2, LayoutGrid, Search, ChevronDown } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const PAGE_SIZE = 20

interface Specialite { id: number; libelle: string; code: string }
interface Niveau    { id: number; code: string; libelle: string; ordre: number }
interface Classe {
  id: number; libelle: string; niveau: string; effectif: number
  specialite: number; specialite_libelle: string; etablissement: number
}
interface ApiList<T> { count: number; results: T[] }

const NIVEAU_COLORS: Record<string, { bg: string; color: string }> = {
  L1: { bg: 'rgba(239,68,68,0.1)',  color: '#EF4444' },
  L2: { bg: 'rgba(14,165,233,0.1)',  color: '#0ea5e9' },
  L3: { bg: 'rgba(6,182,212,0.1)',   color: '#06b6d4' },
  M1: { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6' },
  M2: { bg: 'rgba(124,58,237,0.1)',  color: '#7c3aed' },
  D1: { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
  D2: { bg: 'rgba(217,119,6,0.1)',   color: '#d97706' },
  D3: { bg: 'rgba(180,83,9,0.1)',    color: '#b45309' },
}

const STYLE = (
  <style>{`
    :root { --br: #e2e8f0; --bg: #f8fafc; }
    .sc-wrap { background:#fff; border:1px solid var(--br); border-radius:14px; overflow:hidden; }
    .sc-toolbar { display:flex; align-items:center; gap:.75rem; padding:.875rem 1.125rem; border-bottom:1px solid var(--br); flex-wrap:wrap; }
    .sc-search { display:flex; align-items:center; gap:.5rem; background:var(--bg); border:1px solid var(--br); border-radius:8px; padding:.45rem .75rem; flex:1; min-width:180px; max-width:320px; }
    .sc-search input { background:none; border:none; outline:none; font-size:.8125rem; color:#334155; width:100%; }
    .sc-search input::placeholder { color:#94a3b8; }
    .sc-sel { background:var(--bg); border:1px solid var(--br); border-radius:8px; padding:.45rem .75rem; font-size:.8125rem; color:#475569; cursor:pointer; outline:none; }
    .sc-sel:focus { border-color:#EF4444; }
    .sc-table { width:100%; border-collapse:collapse; }
    .sc-table th { padding:.75rem 1.125rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid var(--br); background:var(--bg); white-space:nowrap; }
    .sc-table td { padding:.75rem 1.125rem; font-size:.8125rem; color:#334155; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .sc-table tr:last-child td { border-bottom:none; }
    .sc-table tr:hover td { background:#f8fafc; }
    .sc-avatar { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; color:#fff; flex-shrink:0; }
    .sc-row { display:flex; align-items:center; gap:.625rem; }
    .sc-primary { font-weight:600; color:#0f172a; }
    .sc-sub { font-size:.75rem; color:#94a3b8; margin-top:1px; }
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
    .mo-box { background:#fff; border-radius:16px 16px 0 0; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; display:flex; flex-direction:column; }
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
    .err-box { background:#fef2f2; border:1px solid #fecaca; border-radius:9px; padding:.625rem .875rem; font-size:.8125rem; color:#ef4444; }
    .btn-ok { background:#EF4444; color:#fff; border:none; border-radius:9px; padding:.55rem 1.25rem; font-size:.875rem; font-weight:600; cursor:pointer; }
    .btn-ok:hover { background:#DC2626; }
    .btn-ok:disabled { opacity:.6; cursor:not-allowed; }
    .btn-cancel { background:none; border:1px solid #e2e8f0; border-radius:9px; padding:.55rem 1.25rem; font-size:.875rem; font-weight:500; color:#64748b; cursor:pointer; }
    .btn-cancel:hover { background:#f8fafc; }
    .ss-wrap { position:relative; }
    .ss-trigger { border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem; font-size:.875rem; color:#334155; cursor:pointer; background:#fff; display:flex; justify-content:space-between; align-items:center; gap:.5rem; transition:border .15s; user-select:none; min-height:38px; width:100%; }
    .ss-trigger:hover, .ss-trigger.open { border-color:#EF4444; }
    .ss-trigger .ph { color:#94a3b8; }
    .ss-dropdown { position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:400; background:#fff; border:1px solid #e2e8f0; border-radius:9px; box-shadow:0 8px 24px rgba(0,0,0,0.1); overflow:hidden; }
    .ss-search { padding:6px 8px; border-bottom:1px solid #f1f5f9; }
    .ss-search input { width:100%; border:none; outline:none; font-size:.8125rem; color:#334155; background:none; }
    .ss-search input::placeholder { color:#94a3b8; }
    .ss-list { max-height:180px; overflow-y:auto; }
    .ss-opt { padding:.5rem .75rem; font-size:.8125rem; cursor:pointer; color:#475569; }
    .ss-opt:hover { background:#f8fafc; color:#0f172a; }
    .ss-opt.sel { background:#FEF2F2; color:#EF4444; font-weight:600; }
    .ss-opt.empty { color:#94a3b8; cursor:default; }
  `}</style>
)

interface Opt { value: string; label: string }
function SearchSelect({ value, onChange, options, placeholder = '— choisir —' }: { value: string; onChange: (v: string) => void; options: Opt[]; placeholder?: string }) {
  const [open, setOpen]   = useState(false)
  const [q, setQ]         = useState('')
  const ref               = useRef<HTMLDivElement>(null)
  const inputRef          = useRef<HTMLInputElement>(null)
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : options
  const selected = options.find(o => o.value === value)
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])
  return (
    <div ref={ref} className="ss-wrap">
      <div className={`ss-trigger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)}>
        <span className={selected ? '' : 'ph'}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={13} color="#94a3b8" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </div>
      {open && (
        <div className="ss-dropdown">
          <div className="ss-search"><input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…" /></div>
          <div className="ss-list">
            {filtered.length === 0
              ? <div className="ss-opt empty">Aucun résultat</div>
              : filtered.map(o => (
                <div key={o.value} className={`ss-opt${o.value === value ? ' sel' : ''}`}
                  onClick={() => { onChange(o.value); setOpen(false); setQ('') }}>
                  {o.label}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

function Pager({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE)
  if (pages <= 1) return null
  const items: (number | 'dot')[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i)
    else if (items[items.length - 1] !== 'dot') items.push('dot')
  }
  return (
    <div className="sc-pager">
      {items.map((it, idx) =>
        it === 'dot'
          ? <span key={`d${idx}`} className="sc-pg dot">…</span>
          : <button key={it} className={`sc-pg${it === page ? ' cur' : ''}`} onClick={() => onPage(it)}>{it}</button>
      )}
    </div>
  )
}

function avatarColor(id: number) {
  const COLORS = ['#EF4444','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#3b82f6','#ec4899']
  return COLORS[id % COLORS.length]
}

export default function ClassesPage() {
  const [list, setList]             = useState<Classe[]>([])
  const [specs, setSpecs]           = useState<Specialite[]>([])
  const [niveaux, setNiveaux]       = useState<Niveau[]>([])
  const [search, setSearch]         = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterSpec, setFilterSpec] = useState('')
  const [page, setPage]             = useState(1)
  const [open, setOpen]             = useState(false)
  const [editing, setEditing]       = useState<Classe | null>(null)
  const [del, setDel]               = useState<Classe | null>(null)
  const [err, setErr]               = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [form, setForm]             = useState({ libelle: '', niveau: '', specialite: '', effectif: '' })

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('dc_user') || 'null') } catch { return null }
  }, [])

  const load = useCallback(() => {
    apiFetch<ApiList<Classe>>('/classes/?limit=500').then(d => setList(d.results)).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const etabId = me?.etablissement
    const etabQ = etabId ? `&etablissement=${etabId}` : ''
    apiFetch<ApiList<Specialite>>(`/specialites/?limit=200${etabQ}`).then(d => setSpecs(d.results)).catch(() => {})
    apiFetch<ApiList<Niveau>>(`/niveaux/?limit=50${etabQ}`).then(d => setNiveaux(d.results)).catch(() => {})
  }, [load, me?.etablissement])

  const filtered = useMemo(() => {
    let r = list
    if (filterNiveau) r = r.filter(c => c.niveau === filterNiveau)
    if (filterSpec) r = r.filter(c => c.specialite === Number(filterSpec))
    const q = search.toLowerCase()
    if (q) r = r.filter(c => c.libelle.toLowerCase().includes(q) || c.specialite_libelle?.toLowerCase().includes(q))
    return r
  }, [list, search, filterNiveau, filterSpec])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditing(null)
    setForm({ libelle: '', niveau: niveaux[0]?.code ?? '', specialite: '', effectif: '' })
    setErr(null); setOpen(true)
  }
  function openEdit(c: Classe) {
    setEditing(c)
    setForm({ libelle: c.libelle, niveau: c.niveau, specialite: String(c.specialite), effectif: String(c.effectif) })
    setErr(null); setOpen(true)
  }

  async function save() {
    if (!form.libelle || !form.specialite) { setErr('Libellé et spécialité obligatoires'); return }
    setSaving(true); setErr(null)
    try {
      const body = {
        libelle: form.libelle, niveau: form.niveau,
        specialite: Number(form.specialite),
        effectif: form.effectif ? Number(form.effectif) : 0,
        etablissement: me?.etablissement,
      }
      if (!editing) await apiFetch('/classes/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/classes/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) {
      const raw = e && typeof e === 'object' ? e as Record<string, unknown> : {}
      setErr(typeof raw.detail === 'string' ? raw.detail : Object.values(raw).flat().join(' ') || 'Erreur')
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/classes/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  const sf = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <>
      {STYLE}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Classes</h1>
          <p className="pg-sub">{filtered.length} classe{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="sc-add" onClick={openAdd}><Plus size={13} /> Nouvelle classe</button>
      </div>

      <div className="sc-wrap">
        <div className="sc-toolbar">
          <div className="sc-search">
            <Search size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input placeholder="Rechercher une classe…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="sc-sel" value={filterNiveau} onChange={e => { setFilterNiveau(e.target.value); setPage(1) }}>
            <option value="">Tous les niveaux</option>
            {niveaux.map(n => <option key={n.id} value={n.code}>{n.code} — {n.libelle}</option>)}
          </select>
          <select className="sc-sel" value={filterSpec} onChange={e => { setFilterSpec(e.target.value); setPage(1) }}>
            <option value="">Toutes les spécialités</option>
            {specs.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="sc-table">
            <thead>
              <tr>
                <th>Classe</th>
                <th>Niveau</th>
                <th>Spécialité</th>
                <th>Effectif</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={5}><div className="sc-empty"><LayoutGrid size={28} style={{ margin: '0 auto 8px', opacity: 0.25 }} /><div>Aucune classe trouvée</div></div></td></tr>
              )}
              {paged.map(c => {
                const nc = NIVEAU_COLORS[c.niveau] ?? { bg: '#f1f5f9', color: '#64748b' }
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="sc-row">
                        <div className="sc-avatar" style={{ background: avatarColor(c.id) }}>
                          {c.libelle.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="sc-primary">{c.libelle}</span>
                      </div>
                    </td>
                    <td><span className="sc-badge" style={{ background: nc.bg, color: nc.color }}>{c.niveau}</span></td>
                    <td style={{ color: '#64748b' }}>{c.specialite_libelle || '—'}</td>
                    <td style={{ color: '#64748b' }}>{c.effectif > 0 ? `${c.effectif} étudiant${c.effectif > 1 ? 's' : ''}` : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>
                      <div className="sc-actions">
                        <button className="sc-btn" onClick={() => openEdit(c)} title="Modifier"><Pencil size={13} /></button>
                        <button className="sc-btn del" onClick={() => setDel(c)} title="Supprimer"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="sc-footer">
          <span className="sc-count">
            {filtered.length === 0 ? 'Aucun résultat'
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} sur ${filtered.length}`}
          </span>
          <Pager total={filtered.length} page={page} onPage={setPage} />
        </div>
      </div>

      {open && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="mo-box">
            <div className="mo-head">
              <span className="mo-title">{editing ? 'Modifier la classe' : 'Nouvelle classe'}</span>
              <button className="mo-x" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="mo-body">
              {err && <div className="err-box">{err}</div>}
              <div className="fl"><label>Libellé <span>*</span></label><input value={form.libelle} onChange={sf('libelle')} placeholder="Ex: L1 Informatique A" /></div>
              <div className="fl-grid2">
                <div className="fl"><label>Niveau <span>*</span></label>
                  <SearchSelect value={form.niveau} onChange={v => setForm(f => ({ ...f, niveau: v }))}
                    options={niveaux.map(n => ({ value: n.code, label: `${n.code} — ${n.libelle}` }))} />
                </div>
                <div className="fl"><label>Effectif</label><input type="number" value={form.effectif} onChange={sf('effectif')} placeholder="0" min={0} /></div>
              </div>
              <div className="fl"><label>Spécialité <span>*</span></label>
                <SearchSelect value={form.specialite} onChange={v => setForm(f => ({ ...f, specialite: v }))}
                  options={specs.map(s => ({ value: String(s.id), label: s.libelle }))} />
              </div>
            </div>
            <div className="mo-foot">
              <button className="btn-cancel" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-ok" onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {del && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setDel(null)}>
          <div className="mo-box" style={{ maxWidth: 400 }}>
            <div className="mo-head"><span className="mo-title">Supprimer la classe ?</span><button className="mo-x" onClick={() => setDel(null)}>✕</button></div>
            <div className="mo-body">
              <p style={{ fontSize: '.875rem', color: '#475569' }}>Supprimer <strong>{del.libelle}</strong> ? Les inscriptions liées seront également supprimées.</p>
            </div>
            <div className="mo-foot">
              <button className="btn-cancel" onClick={() => setDel(null)}>Annuler</button>
              <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 9, padding: '.55rem 1.25rem', fontSize: '.875rem', fontWeight: 600, cursor: 'pointer' }} onClick={doDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
