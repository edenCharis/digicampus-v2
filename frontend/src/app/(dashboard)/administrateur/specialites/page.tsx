'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, BookMarked } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { Etablissement, Parcours, Specialite, ApiList } from '../_shared'
import {
  TABLE_STYLE, SearchInput, Pager, Modal, ModalHead, ModalBody, ModalFoot,
  FLabel, FInput, FSelect, BtnPrimary, BtnGhost, ErrBanner, ConfirmModal
} from '../_table'

const PAGE_SIZE = 15
const COLORS = ['#1AAFE6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#3b82f6','#ec4899']

function getMe() {
  try { return JSON.parse(localStorage.getItem('dc_user') || 'null') } catch { return null }
}

export default function SpecialitesPage() {
  const [etabs, setEtabs]       = useState<Etablissement[]>([])
  const [etabId, setEtabId]     = useState('')
  const [parcours, setParcours] = useState<Parcours[]>([])
  const [list, setList]         = useState<Specialite[]>([])
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<Specialite | null>(null)
  const [del, setDel]           = useState<Specialite | null>(null)
  const [form, setForm]         = useState({ code: '', libelle: '', parcours: '' })
  const [err, setErr]           = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    const me = getMe()
    const q = me?.university ? `?university=${me.university}&limit=100` : '?limit=100'
    apiFetch<ApiList<Etablissement>>(`/etablissements/${q}`).then(d => {
      setEtabs(d.results)
      if (d.results.length > 0) setEtabId(String(d.results[0].id))
    }).catch(() => {})
  }, [])

  const load = useCallback(() => {
    if (!etabId) return
    Promise.all([
      apiFetch<ApiList<Specialite>>(`/specialites/?etablissement=${etabId}&limit=200`),
      apiFetch<ApiList<Parcours>>(`/parcours/?etablissement=${etabId}&limit=100`),
    ]).then(([sp, pa]) => {
      setList(sp.results)
      setParcours(pa.results)
    }).catch(() => {})
  }, [etabId])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return list
    return list.filter(s =>
      s.libelle.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) ||
      (s.parcours_libelle || '').toLowerCase().includes(q)
    )
  }, [list, search])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditing(null); setForm({ code: '', libelle: '', parcours: '' }); setErr(null); setOpen(true)
  }
  function openEdit(s: Specialite) {
    setEditing(s)
    setForm({ code: s.code, libelle: s.libelle, parcours: s.parcours ? String(s.parcours) : '' })
    setErr(null); setOpen(true)
  }

  async function save() {
    if (!form.libelle || !form.code || !etabId) { setErr('Code et libellé obligatoires'); return }
    setSaving(true); setErr(null)
    try {
      const body: Record<string, unknown> = {
        code: form.code.toUpperCase(), libelle: form.libelle, etablissement: Number(etabId),
        parcours: form.parcours ? Number(form.parcours) : null,
      }
      if (!editing) await apiFetch('/specialites/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/specialites/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) {
      const raw = e && typeof e === 'object' ? e as Record<string, unknown> : {}
      setErr(typeof raw.detail === 'string' ? raw.detail : Object.values(raw).flat().join(' ') || 'Erreur')
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/specialites/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  const etabLabel = etabs.find(e => String(e.id) === etabId)?.libelle || ''
  function accent(s: Specialite) { return COLORS[s.id % COLORS.length] }

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
          <h1 className="pg-title">Spécialités</h1>
          <p className="pg-sub">{etabLabel && `${etabLabel} · `}{filtered.length} spécialité{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {etabs.length > 1 && (
            <select className="pt-sel" value={etabId} onChange={e => { setEtabId(e.target.value); setPage(1) }}>
              {etabs.map(e => <option key={e.id} value={e.id}>{e.libelle}</option>)}
            </select>
          )}
          <button className="pt-add" onClick={openAdd} disabled={!etabId}><Plus size={13} /> Ajouter</button>
        </div>
      </div>

      <div className="pt-wrap">
        <div className="pt-toolbar">
          <div className="pt-toolbar-left">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher une spécialité…" />
          </div>
        </div>

        <table className="pt-table">
          <thead><tr><th>Spécialité</th><th>Code</th><th>Parcours</th><th></th></tr></thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={4}><div className="pt-empty"><BookMarked size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} /><div>Aucune spécialité</div></div></td></tr>
            )}
            {paged.map(s => (
              <tr key={s.id}>
                <td>
                  <div className="pt-cell-row">
                    <div className="pt-avatar" style={{ background: accent(s) }}>{s.code.slice(0, 2).toUpperCase()}</div>
                    <span className="pt-primary">{s.libelle}</span>
                  </div>
                </td>
                <td><span className="pt-badge" style={{ background: `${accent(s)}18`, color: accent(s) }}>{s.code}</span></td>
                <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{s.parcours_libelle || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                <td>
                  <div className="pt-actions">
                    <button className="pt-ico-btn" onClick={() => openEdit(s)} title="Modifier"><Pencil size={12} /></button>
                    <button className="pt-ico-btn del" onClick={() => setDel(s)} title="Supprimer"><Trash2 size={12} /></button>
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
          <ModalHead title={editing ? 'Modifier la spécialité' : 'Nouvelle spécialité'} onClose={() => setOpen(false)} />
          <ModalBody>
            {err && <ErrBanner msg={err} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <FLabel label="Libellé" req>
                <FInput value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex: Génie Logiciel" />
              </FLabel>
              <FLabel label="Code" req>
                <FInput value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Ex: GL" />
              </FLabel>
            </div>
            <FLabel label="Parcours">
              <FSelect value={form.parcours} onChange={e => setForm(f => ({ ...f, parcours: e.target.value }))}>
                <option value="">— Aucun —</option>
                {parcours.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
              </FSelect>
            </FLabel>
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
