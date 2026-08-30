'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Pencil, CreditCard, CheckCircle2, AlertCircle, Ban, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { University, Abonnement, ApiList } from '../_shared'
import { ABONNEMENT_STATUTS, ALL_MODULES } from '../_shared'
import {
  TABLE_STYLE, SearchInput, Pager, Modal, ModalHead, ModalBody, ModalFoot,
  FLabel, FInput, FSelect, BtnPrimary, BtnGhost, ErrBanner
} from '../_table'

const PAGE_SIZE = 12

const STATUT_ICONS: Record<string, React.ReactNode> = {
  actif:    <CheckCircle2 size={10} />,
  essai:    <Clock size={10} />,
  expiré:   <AlertCircle size={10} />,
  suspendu: <Ban size={10} />,
}

export default function AbonnementsPage() {
  const [univs, setUnivs]     = useState<University[]>([])
  const [abons, setAbons]     = useState<Abonnement[]>([])
  const [search, setSearch]   = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [page, setPage]       = useState(1)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Abonnement | null>(null)
  const [form, setForm]       = useState({ statut: 'essai', date_debut: '', date_fin: '', max_users: '50', modules: [] as string[], notes: '' })
  const [err, setErr]         = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    apiFetch<ApiList<Abonnement>>('/abonnements/?limit=500').then(d => setAbons(d.results)).catch(() => {})
    apiFetch<ApiList<University>>('/universities/?limit=200').then(d => setUnivs(d.results)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let r = abons
    if (filterStatut) r = r.filter(a => a.statut === filterStatut)
    const q = search.toLowerCase()
    if (q) r = r.filter(a => a.university_name?.toLowerCase().includes(q) || a.university_code?.toLowerCase().includes(q))
    return r
  }, [abons, search, filterStatut])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openEdit(ab: Abonnement) {
    setEditing(ab)
    setForm({
      statut: ab.statut,
      date_debut: ab.date_debut || '',
      date_fin: ab.date_fin || '',
      max_users: String(ab.max_users),
      modules: ab.modules || [],
      notes: ab.notes || '',
    })
    setErr(null); setOpen(true)
  }

  function toggleModule(m: string) {
    setForm(f => ({ ...f, modules: f.modules.includes(m) ? f.modules.filter(x => x !== m) : [...f.modules, m] }))
  }

  async function save() {
    if (!editing) return
    setSaving(true); setErr(null)
    try {
      const body = { ...form, max_users: Number(form.max_users) }
      await apiFetch(`/abonnements/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'detail' in e ? String((e as {detail: string}).detail) : 'Erreur lors de la sauvegarde'
      setErr(msg)
    } finally { setSaving(false) }
  }

  function fmtDate(d: string | null) {
    if (!d) return <span style={{ color: '#cbd5e1' }}>—</span>
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function statutInfo(s: string) {
    return ABONNEMENT_STATUTS.find(x => x.value === s) || { value: s, label: s, color: '#94a3b8' }
  }

  return (
    <>
      {TABLE_STYLE}
      <style>{`
        .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:0.75rem; }
        .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
        .pg-sub    { font-size:0.75rem; color:#94a3b8; margin:.25rem 0 0; }
        .mod-chip  { display:inline-flex; align-items:center; font-size:0.63rem; font-weight:700; padding:2px 7px; border-radius:20px; background:#f1f5f9; color:#64748b; text-transform:uppercase; letter-spacing:.04em; }
        .mod-chips { display:flex; flex-wrap:wrap; gap:3px; }
        .mod-sel   { display:inline-flex; align-items:center; gap:5px; font-size:0.8rem; padding:5px 10px; border-radius:8px; border:1.5px solid #e2e8f0; cursor:pointer; transition:all .12s; user-select:none; }
        .mod-sel.on{ border-color:#1AAFE6; background:rgba(26,175,230,0.07); color:#1AAFE6; font-weight:600; }
        .mod-grid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:6px; }
      `}</style>

      <div className="pg-header">
        <div>
          <h1 className="pg-title">Abonnements</h1>
          <p className="pg-sub">{filtered.length} abonnement{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="pt-wrap">
        <div className="pt-toolbar">
          <div className="pt-toolbar-left">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Université…" />
            <select className="pt-sel" value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(1) }}>
              <option value="">Tous les statuts</option>
              {ABONNEMENT_STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <table className="pt-table">
          <thead>
            <tr>
              <th>Université</th>
              <th>Statut</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Max utilisateurs</th>
              <th>Modules</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={7}><div className="pt-empty"><CreditCard size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} /><div>Aucun abonnement trouvé</div></div></td></tr>
            )}
            {paged.map(ab => {
              const st = statutInfo(ab.statut)
              return (
                <tr key={ab.id}>
                  <td>
                    <div className="pt-cell-row">
                      <div className="pt-avatar" style={{ background: '#1AAFE6', fontSize: '0.68rem' }}>
                        {(ab.university_code || '??').slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="pt-primary">{ab.university_name}</div>
                        <div className="pt-secondary">{ab.user_count} utilisateur{ab.user_count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pt-badge" style={{ background: `${st.color}18`, color: st.color }}>
                      {STATUT_ICONS[st.value]} {st.label}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{fmtDate(ab.date_debut)}</td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{fmtDate(ab.date_fin)}</td>
                  <td style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>{ab.max_users}</td>
                  <td>
                    <div className="mod-chips">
                      {(ab.modules || []).length === 0
                        ? <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Aucun</span>
                        : (ab.modules || []).slice(0, 4).map(m => <span key={m} className="mod-chip">{m}</span>)
                      }
                      {(ab.modules || []).length > 4 && <span className="mod-chip">+{(ab.modules || []).length - 4}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="pt-actions">
                      <button className="pt-ico-btn" onClick={() => openEdit(ab)} title="Modifier"><Pencil size={12} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="pt-footer">
          <span className="pt-count">
            {filtered.length === 0 ? 'Aucun résultat' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} sur ${filtered.length}`}
          </span>
          <Pager total={filtered.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>

      {open && editing && (
        <Modal onClose={() => setOpen(false)} width={540}>
          <ModalHead title={`Abonnement — ${editing.university_name}`} onClose={() => setOpen(false)} />
          <ModalBody>
            {err && <ErrBanner msg={err} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <FLabel label="Statut" req>
                <FSelect value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                  {ABONNEMENT_STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FSelect>
              </FLabel>
              <FLabel label="Max utilisateurs">
                <FInput type="number" min={1} value={form.max_users} onChange={e => setForm(f => ({ ...f, max_users: e.target.value }))} />
              </FLabel>
              <FLabel label="Date de début">
                <FInput type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} />
              </FLabel>
              <FLabel label="Date de fin">
                <FInput type="date" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} />
              </FLabel>
            </div>
            <FLabel label="Modules actifs">
              <div className="mod-grid" style={{ marginTop: 4 }}>
                {ALL_MODULES.map(m => (
                  <div key={m} className={`mod-sel${form.modules.includes(m) ? ' on' : ''}`} onClick={() => toggleModule(m)}>
                    {form.modules.includes(m) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    {m}
                  </div>
                ))}
              </div>
            </FLabel>
            <FLabel label="Notes">
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                style={{ width: '100%', height: 72, padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: '0.875rem', color: '#1e293b', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </FLabel>
          </ModalBody>
          <ModalFoot>
            <BtnGhost onClick={() => setOpen(false)}>Annuler</BtnGhost>
            <BtnPrimary onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</BtnPrimary>
          </ModalFoot>
        </Modal>
      )}
    </>
  )
}
