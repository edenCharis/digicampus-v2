'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, User, Eye, Search } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const PAGE_SIZE = 20

interface Specialite { id: number; libelle: string; code: string }
interface Etudiant {
  id: number; code: string; nom: string; prenom: string; nom_complet: string
  sexe: string; email: string; tel: string; specialite: number | null
  specialite_libelle: string | null; statut: string; etat: boolean
  date_candidature: string; created_at: string
}
interface ApiList<T> { count: number; results: T[] }

const STATUT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'en cours': { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', label: 'En cours' },
  admis:      { bg: 'rgba(26,175,230,0.1)',  color: '#1AAFE6', label: 'Admis' },
  inscrit:    { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', label: 'Inscrit' },
  'refusé':   { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', label: 'Refusé' },
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
    .sc-sel:focus { border-color:#1AAFE6; }
    .sc-table { width:100%; border-collapse:collapse; }
    .sc-table th { padding:.75rem 1.125rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid var(--br); background:var(--bg); white-space:nowrap; }
    .sc-table td { padding:.75rem 1.125rem; font-size:.8125rem; color:#334155; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .sc-table tr:last-child td { border-bottom:none; }
    .sc-table tr:hover td { background:#f8fafc; }
    .sc-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; color:#fff; flex-shrink:0; }
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
    .sc-pg.cur { background:#1AAFE6; color:#fff; border-color:#1AAFE6; font-weight:700; }
    .sc-pg.dot { border:none; background:none; cursor:default; color:#94a3b8; }
    .sc-add { display:inline-flex; align-items:center; gap:.375rem; background:#1AAFE6; color:#fff; border:none; border-radius:9px; padding:.5rem 1rem; font-size:.8125rem; font-weight:600; cursor:pointer; transition:background .15s; white-space:nowrap; }
    .sc-add:hover { background:#0d9ed4; }
    .sc-empty { padding:2.5rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
    .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub    { font-size:.75rem; color:#94a3b8; margin:.25rem 0 0; }
    /* Modal overlay */
    .mo { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
    @media(min-width:640px){ .mo { align-items:center; } }
    .mo-box { background:#fff; border-radius:16px 16px 0 0; width:100%; max-width:600px; max-height:90vh; overflow-y:auto; display:flex; flex-direction:column; }
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
    .fl input, .fl select, .fl textarea { width:100%; border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem; font-size:.875rem; color:#334155; outline:none; transition:border .15s; background:#fff; }
    .fl input:focus, .fl select:focus { border-color:#1AAFE6; }
    .fl-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .fl-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.875rem; }
    .err-box { background:#fef2f2; border:1px solid #fecaca; border-radius:9px; padding:.625rem .875rem; font-size:.8125rem; color:#ef4444; }
    .btn-ok { background:#1AAFE6; color:#fff; border:none; border-radius:9px; padding:.55rem 1.25rem; font-size:.875rem; font-weight:600; cursor:pointer; }
    .btn-ok:hover { background:#0d9ed4; }
    .btn-ok:disabled { opacity:.6; cursor:not-allowed; }
    .btn-cancel { background:none; border:1px solid #e2e8f0; border-radius:9px; padding:.55rem 1.25rem; font-size:.875rem; font-weight:500; color:#64748b; cursor:pointer; }
    .btn-cancel:hover { background:#f8fafc; }
    .mo-section { font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; padding-bottom:.5rem; border-bottom:1px solid #f1f5f9; margin-top:.25rem; }
  `}</style>
)

function initials(nom: string, prenom: string) {
  return ((nom[0] ?? '') + (prenom[0] ?? '')).toUpperCase()
}
function avatarColor(id: number) {
  const COLORS = ['#1AAFE6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#3b82f6','#ec4899']
  return COLORS[id % COLORS.length]
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

export default function EtudiantsPage() {
  const [list, setList]             = useState<Etudiant[]>([])
  const [specs, setSpecs]           = useState<Specialite[]>([])
  const [search, setSearch]         = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [page, setPage]             = useState(1)
  const [open, setOpen]             = useState(false)
  const [editing, setEditing]       = useState<Etudiant | null>(null)
  const [del, setDel]               = useState<Etudiant | null>(null)
  const [err, setErr]               = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [form, setForm]             = useState({
    nom: '', prenom: '', sexe: 'M', date_nais: '', lieu_nais: '', nationalite: 'Congolaise',
    email: '', tel: '', specialite: '', etat: true,
  })

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('dc_user') || 'null') } catch { return null }
  }, [])

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: '500' })
    apiFetch<ApiList<Etudiant>>(`/etudiants/?${params}`).then(d => setList(d.results)).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    apiFetch<ApiList<Specialite>>('/specialites/?limit=200').then(d => setSpecs(d.results)).catch(() => {})
  }, [load])

  const filtered = useMemo(() => {
    let r = list
    if (filterStatut) r = r.filter(e => e.statut === filterStatut)
    const q = search.toLowerCase()
    if (q) r = r.filter(e =>
      e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q) ||
      e.code.toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q)
    )
    return r
  }, [list, search, filterStatut])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditing(null)
    setForm({ nom: '', prenom: '', sexe: 'M', date_nais: '', lieu_nais: '', nationalite: 'Congolaise', email: '', tel: '', specialite: '', etat: true })
    setErr(null); setOpen(true)
  }
  function openEdit(e: Etudiant) {
    setEditing(e)
    setForm({
      nom: e.nom, prenom: e.prenom, sexe: e.sexe, date_nais: '',
      lieu_nais: '', nationalite: '', email: e.email || '', tel: e.tel || '',
      specialite: e.specialite ? String(e.specialite) : '', etat: e.etat,
    })
    setErr(null); setOpen(true)
  }

  async function save() {
    if (!form.nom || !form.prenom) { setErr('Nom et prénom obligatoires'); return }
    setSaving(true); setErr(null)
    try {
      const body: Record<string, unknown> = {
        nom: form.nom, prenom: form.prenom, sexe: form.sexe,
        date_nais: form.date_nais || null, lieu_nais: form.lieu_nais,
        nationalite: form.nationalite, email: form.email, tel: form.tel,
        specialite: form.specialite ? Number(form.specialite) : null,
        etat: form.etat, etablissement: me?.etablissement,
      }
      if (!editing) await apiFetch('/etudiants/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/etudiants/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) {
      const raw = e && typeof e === 'object' ? e as Record<string, unknown> : {}
      setErr(typeof raw.detail === 'string' ? raw.detail : Object.values(raw).flat().join(' ') || 'Erreur')
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/etudiants/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  const sf = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <>
      {STYLE}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Étudiants</h1>
          <p className="pg-sub">{filtered.length} étudiant{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="sc-add" onClick={openAdd}><Plus size={13} /> Nouvel étudiant</button>
      </div>

      <div className="sc-wrap">
        <div className="sc-toolbar">
          <div className="sc-search">
            <Search size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input placeholder="Nom, prénom, code…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="sc-sel" value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(1) }}>
            <option value="">Tous les statuts</option>
            <option value="en cours">En cours</option>
            <option value="admis">Admis</option>
            <option value="inscrit">Inscrit</option>
            <option value="refusé">Refusé</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="sc-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Code</th>
                <th>Spécialité</th>
                <th>Contact</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={6}><div className="sc-empty"><User size={28} style={{ margin: '0 auto 8px', opacity: 0.25 }} /><div>Aucun étudiant trouvé</div></div></td></tr>
              )}
              {paged.map(e => {
                const st = STATUT_COLORS[e.statut] ?? { bg: '#f1f5f9', color: '#64748b', label: e.statut }
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="sc-row">
                        <div className="sc-avatar" style={{ background: avatarColor(e.id) }}>{initials(e.nom, e.prenom)}</div>
                        <div>
                          <div className="sc-primary">{e.nom} {e.prenom}</div>
                          <div className="sc-sub">{e.sexe === 'M' ? 'Masculin' : 'Féminin'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '.8rem', color: '#64748b' }}>{e.code}</span></td>
                    <td style={{ color: '#64748b' }}>{e.specialite_libelle || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td style={{ color: '#64748b' }}>
                      <div>{e.email || '—'}</div>
                      <div className="sc-sub">{e.tel || ''}</div>
                    </td>
                    <td><span className="sc-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                    <td>
                      <div className="sc-actions">
                        <button className="sc-btn" onClick={() => openEdit(e)} title="Modifier"><Pencil size={13} /></button>
                        <button className="sc-btn del" onClick={() => setDel(e)} title="Supprimer"><Trash2 size={13} /></button>
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

      {/* Add/Edit modal */}
      {open && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="mo-box">
            <div className="mo-head">
              <span className="mo-title">{editing ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}</span>
              <button className="mo-x" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="mo-body">
              {err && <div className="err-box">{err}</div>}
              <div className="mo-section">Identité</div>
              <div className="fl-grid3">
                <div className="fl"><label>Nom <span>*</span></label><input value={form.nom} onChange={sf('nom')} placeholder="Nom de famille" /></div>
                <div className="fl"><label>Prénom <span>*</span></label><input value={form.prenom} onChange={sf('prenom')} placeholder="Prénom" /></div>
                <div className="fl"><label>Sexe</label>
                  <select value={form.sexe} onChange={sf('sexe')}>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>
              <div className="fl-grid2">
                <div className="fl"><label>Date de naissance</label><input type="date" value={form.date_nais} onChange={sf('date_nais')} /></div>
                <div className="fl"><label>Lieu de naissance</label><input value={form.lieu_nais} onChange={sf('lieu_nais')} placeholder="Ville" /></div>
              </div>
              <div className="fl"><label>Nationalité</label><input value={form.nationalite} onChange={sf('nationalite')} placeholder="Ex: Congolaise" /></div>
              <div className="mo-section">Contact</div>
              <div className="fl-grid2">
                <div className="fl"><label>Email</label><input type="email" value={form.email} onChange={sf('email')} /></div>
                <div className="fl"><label>Téléphone</label><input value={form.tel} onChange={sf('tel')} /></div>
              </div>
              <div className="mo-section">Académique</div>
              <div className="fl"><label>Spécialité</label>
                <select value={form.specialite} onChange={sf('specialite')}>
                  <option value="">— Aucune —</option>
                  {specs.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                </select>
              </div>
              {editing && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8125rem', color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.etat} onChange={e => setForm(f => ({ ...f, etat: e.target.checked }))} />
                  Étudiant actif
                </label>
              )}
            </div>
            <div className="mo-foot">
              <button className="btn-cancel" onClick={() => setOpen(false)}>Annuler</button>
              <button className="btn-ok" onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {del && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setDel(null)}>
          <div className="mo-box" style={{ maxWidth: 400 }}>
            <div className="mo-head"><span className="mo-title">Supprimer l&apos;étudiant ?</span><button className="mo-x" onClick={() => setDel(null)}>✕</button></div>
            <div className="mo-body">
              <p style={{ fontSize: '.875rem', color: '#475569' }}>
                Supprimer <strong>{del.nom} {del.prenom}</strong> ({del.code}) ? Cette action supprimera aussi ses inscriptions.
              </p>
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
