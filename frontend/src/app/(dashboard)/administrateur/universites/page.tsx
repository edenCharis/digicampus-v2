'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, MapPin, Mail, Phone, Building2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { University, ApiList } from '../_shared'
import {
  TABLE_STYLE, SearchInput, Pager, Modal, ModalHead, ModalBody, ModalFoot,
  FLabel, FInput, BtnPrimary, BtnGhost, ErrBanner, ConfirmModal
} from '../_table'

const PAGE_SIZE = 15

export default function UniversitesPage() {
  const [list, setList]       = useState<University[]>([])
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<University | null>(null)
  const [del, setDel]         = useState<University | null>(null)
  const [form, setForm]       = useState({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' })
  const [err, setErr]         = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    apiFetch<ApiList<University>>('/universities/?limit=500').then(d => setList(d.results)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return list
    return list.filter(u =>
      u.libelle.toLowerCase().includes(q) || u.code.toLowerCase().includes(q) ||
      (u.ville || '').toLowerCase().includes(q)
    )
  }, [list, search])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditing(null)
    setForm({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' })
    setErr(null); setOpen(true)
  }
  function openEdit(u: University) {
    setEditing(u)
    setForm({ code: u.code, libelle: u.libelle, email_contact: u.email_contact || '', tel_contact: u.tel_contact || '', ville: u.ville || '' })
    setErr(null); setOpen(true)
  }

  async function save() {
    if (!form.libelle || !form.code) { setErr('Libellé et code obligatoires'); return }
    setSaving(true); setErr(null)
    try {
      if (!editing) await apiFetch('/universities/', { method: 'POST', body: JSON.stringify(form) })
      else await apiFetch(`/universities/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(form) })
      setOpen(false); load()
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'detail' in e ? String((e as {detail: string}).detail) : 'Erreur lors de la sauvegarde'
      setErr(msg)
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/universities/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  const COLORS = ['#1AAFE6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#3b82f6','#ec4899']
  function accent(u: University) { return COLORS[u.id % COLORS.length] }

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
          <h1 className="pg-title">Universités</h1>
          <p className="pg-sub">{filtered.length} université{filtered.length !== 1 ? 's' : ''} enregistrée{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="pt-add" onClick={openAdd}><Plus size={13} /> Ajouter</button>
      </div>

      <div className="pt-wrap">
        <div className="pt-toolbar">
          <div className="pt-toolbar-left">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher par nom, code, ville…" />
          </div>
        </div>

        <table className="pt-table">
          <thead>
            <tr>
              <th>Université</th>
              <th>Code</th>
              <th>Ville</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={6}><div className="pt-empty"><Building2 size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} /><div>Aucune université trouvée</div></div></td></tr>
            )}
            {paged.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="pt-cell-row">
                    <div className="pt-avatar" style={{ background: accent(u) }}>
                      {u.libelle.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || u.code.slice(0, 2).toUpperCase()}
                    </div>
                    <div><div className="pt-primary">{u.libelle}</div></div>
                  </div>
                </td>
                <td><span className="pt-badge" style={{ background: `${accent(u)}18`, color: accent(u) }}>{u.code}</span></td>
                <td>
                  {u.ville
                    ? <div className="pt-cell-row" style={{ gap: 4, color: '#64748b', fontSize: '0.8125rem' }}><MapPin size={12} />{u.ville}</div>
                    : <span style={{ color: '#cbd5e1' }}>—</span>
                  }
                </td>
                <td>
                  {u.email_contact
                    ? <div className="pt-cell-row" style={{ gap: 4, color: '#64748b', fontSize: '0.8125rem' }}><Mail size={12} />{u.email_contact}</div>
                    : <span style={{ color: '#cbd5e1' }}>—</span>
                  }
                </td>
                <td>
                  {u.tel_contact
                    ? <div className="pt-cell-row" style={{ gap: 4, color: '#64748b', fontSize: '0.8125rem' }}><Phone size={12} />{u.tel_contact}</div>
                    : <span style={{ color: '#cbd5e1' }}>—</span>
                  }
                </td>
                <td>
                  <div className="pt-actions">
                    <button className="pt-ico-btn" onClick={() => openEdit(u)} title="Modifier"><Pencil size={12} /></button>
                    <button className="pt-ico-btn del" onClick={() => setDel(u)} title="Supprimer"><Trash2 size={12} /></button>
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
          <ModalHead title={editing ? "Modifier l'université" : 'Nouvelle université'} onClose={() => setOpen(false)} />
          <ModalBody>
            {err && <ErrBanner msg={err} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <FLabel label="Libellé" req><FInput value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Nom complet" /></FLabel>
              <FLabel label="Code" req><FInput value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Ex: UNIKIN" /></FLabel>
            </div>
            <FLabel label="Ville"><FInput value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} placeholder="Ex: Kinshasa" /></FLabel>
            <FLabel label="Email de contact"><FInput type="email" value={form.email_contact} onChange={e => setForm(f => ({ ...f, email_contact: e.target.value }))} placeholder="contact@universite.cd" /></FLabel>
            <FLabel label="Téléphone"><FInput value={form.tel_contact} onChange={e => setForm(f => ({ ...f, tel_contact: e.target.value }))} placeholder="+243 …" /></FLabel>
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
