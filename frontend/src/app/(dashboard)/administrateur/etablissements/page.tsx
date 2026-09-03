'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, Building } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { University, Etablissement, ApiList } from '../_shared'
import {
  TABLE_STYLE, SearchInput, Pager, Modal, ModalHead, ModalBody, ModalFoot,
  FLabel, FInput, FSelect, BtnPrimary, BtnGhost, ErrBanner, ConfirmModal
} from '../_table'

const PAGE_SIZE = 15

export default function EtablissementsPage() {
  const [univs, setUnivs]       = useState<University[]>([])
  const [list, setList]         = useState<Etablissement[]>([])
  const [search, setSearch]     = useState('')
  const [filterUniv, setFilterUniv] = useState('')
  const [page, setPage]         = useState(1)
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<Etablissement | null>(null)
  const [del, setDel]           = useState<Etablissement | null>(null)
  const [form, setForm]         = useState({ code: '', libelle: '', university: '', email: '', tel: '', ville: '' })
  const [err, setErr]           = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    apiFetch<ApiList<University>>('/universities/?limit=200').then(d => setUnivs(d.results)).catch(() => {})
  }, [])

  const load = useCallback(() => {
    const q = filterUniv ? `?university=${filterUniv}&limit=500` : '?limit=500'
    apiFetch<ApiList<Etablissement>>(`/etablissements/${q}`).then(d => setList(d.results)).catch(() => {})
  }, [filterUniv])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return list
    return list.filter(e =>
      e.libelle.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) ||
      (e.ville || '').toLowerCase().includes(q) || (e.university_name || '').toLowerCase().includes(q)
    )
  }, [list, search])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditing(null)
    // default to the currently selected filter university, or first in list
    const defaultUniv = filterUniv || (univs[0] ? String(univs[0].id) : '')
    setForm({ code: '', libelle: '', university: defaultUniv, email: '', tel: '', ville: '' })
    setErr(null); setOpen(true)
  }
  function openEdit(e: Etablissement) {
    setEditing(e)
    setForm({ code: e.code, libelle: e.libelle, university: String(e.university), email: e.email || '', tel: e.tel || '', ville: e.ville || '' })
    setErr(null); setOpen(true)
  }

  async function save() {
    if (!form.libelle || !form.code || !form.university) { setErr('Libellé, code et université obligatoires'); return }
    setSaving(true); setErr(null)
    try {
      const body = { ...form, university: Number(form.university) }
      if (!editing) await apiFetch('/etablissements/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/etablissements/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setOpen(false)
      // align filter with the saved item's university so it's visible immediately
      setFilterUniv(form.university)
    } catch (e: unknown) {
      const raw = e && typeof e === 'object' ? e as Record<string, unknown> : {}
      const msg = typeof raw.detail === 'string'
        ? raw.detail
        : Object.values(raw).flat().join(' ') || 'Erreur lors de la sauvegarde'
      setErr(msg)
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/etablissements/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  const COLORS = ['#EF4444','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#3b82f6','#ec4899']
  function accent(e: Etablissement) { return COLORS[e.id % COLORS.length] }

  return (
    <>
      {TABLE_STYLE}
      <style>{`
        .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:0.75rem; }
        .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
        .pg-sub    { font-size:0.75rem; color:#94a3b8; margin:.25rem 0 0; }
      `}</style>

      <div className="pg-header">
        <div>
          <h1 className="pg-title">Établissements</h1>
          <p className="pg-sub">{filtered.length} établissement{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="pt-add" onClick={openAdd}><Plus size={13} /> Ajouter</button>
      </div>

      <div className="pt-wrap">
        <div className="pt-toolbar">
          <div className="pt-toolbar-left">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher…" />
            <select className="pt-sel" value={filterUniv} onChange={e => { setFilterUniv(e.target.value); setPage(1) }}>
              <option value="">Toutes les universités</option>
              {univs.map(u => <option key={u.id} value={u.id}>{u.libelle}</option>)}
            </select>
          </div>
        </div>

        <table className="pt-table">
          <thead>
            <tr>
              <th>Établissement</th>
              <th>Code</th>
              <th>Université</th>
              <th>Ville</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={7}><div className="pt-empty"><Building size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} /><div>Aucun établissement trouvé</div></div></td></tr>
            )}
            {paged.map(e => (
              <tr key={e.id}>
                <td>
                  <div className="pt-cell-row">
                    <div className="pt-avatar" style={{ background: accent(e) }}>
                      {e.libelle.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || e.code.slice(0, 2).toUpperCase()}
                    </div>
                    <div><div className="pt-primary">{e.libelle}</div></div>
                  </div>
                </td>
                <td><span className="pt-badge" style={{ background: `${accent(e)}18`, color: accent(e) }}>{e.code}</span></td>
                <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{e.university_name || '—'}</td>
                <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{e.ville || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{e.email || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{e.tel || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                <td>
                  <div className="pt-actions">
                    <button className="pt-ico-btn" onClick={() => openEdit(e)} title="Modifier"><Pencil size={12} /></button>
                    <button className="pt-ico-btn del" onClick={() => setDel(e)} title="Supprimer"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-footer">
          <span className="pt-count">
            {filtered.length === 0 ? 'Aucun résultat' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} sur ${filtered.length}`}
          </span>
          <Pager total={filtered.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <ModalHead title={editing ? 'Modifier l\'établissement' : 'Nouvel établissement'} onClose={() => setOpen(false)} />
          <ModalBody>
            {err && <ErrBanner msg={err} />}
            <FLabel label="Université" req>
              <FSelect value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))}>
                <option value="">— Choisir —</option>
                {univs.map(u => <option key={u.id} value={u.id}>{u.libelle}</option>)}
              </FSelect>
            </FLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <FLabel label="Libellé" req><FInput value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Nom de l'établissement" /></FLabel>
              <FLabel label="Code" req><FInput value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Ex: ETAB01" /></FLabel>
            </div>
            <FLabel label="Ville"><FInput value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} placeholder="Ex: Kinshasa" /></FLabel>
            <FLabel label="Email"><FInput type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></FLabel>
            <FLabel label="Téléphone"><FInput value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} /></FLabel>
          </ModalBody>
          <ModalFoot>
            <BtnGhost onClick={() => setOpen(false)}>Annuler</BtnGhost>
            <BtnPrimary onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</BtnPrimary>
          </ModalFoot>
        </Modal>
      )}

      {del && <ConfirmModal name={del.libelle} onYes={doDelete} onNo={() => setDel(null)} />}
    </>
  )
}
