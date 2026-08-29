'use client'
import { useEffect, useState, useRef } from 'react'
import { User, Mail, Lock, CheckCircle2, AlertTriangle, Pencil, X, Eye, EyeOff, Camera, Trash2 } from 'lucide-react'
import { apiFetch, apiUpload } from '@/lib/api'
import { ROLE_LABELS } from '@/lib/utils'

const MEDIA_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace('/api', '')

interface Me {
  id: number; login: string; nom: string; email: string; photo: string | null; role: string;
  university_name: string | null; etablissement_name: string | null; created_at: string;
}

type Toast = { type: 'ok' | 'err'; msg: string }

export default function ComptePage() {
  const [me, setMe]               = useState<Me | null>(null)
  const [editOpen, setEditOpen]   = useState(false)
  const [pwOpen, setPwOpen]       = useState(false)
  const [nom, setNom]             = useState('')
  const [email, setEmail]         = useState('')
  const [oldPw, setOldPw]         = useState('')
  const [newPw, setNewPw]         = useState('')
  const [showOld, setShowOld]     = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast]         = useState<Toast | null>(null)
  const fileRef                   = useRef<HTMLInputElement>(null)

  function showToast(t: Toast) {
    setToast(t)
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    apiFetch<Me>('/auth/me/').then(d => { setMe(d); setNom(d.nom); setEmail(d.email) }).catch(() => {})
  }, [])

  async function saveProfile() {
    setSaving(true)
    try {
      const updated = await apiFetch<Me>('/auth/me/', { method: 'PATCH', body: JSON.stringify({ nom, email }) })
      setMe(updated)
      // sync localStorage
      const stored = localStorage.getItem('dc_user')
      if (stored) localStorage.setItem('dc_user', JSON.stringify({ ...JSON.parse(stored), nom: updated.nom, email: updated.email }))
      setEditOpen(false)
      showToast({ type: 'ok', msg: 'Profil mis à jour avec succès.' })
    } catch { showToast({ type: 'err', msg: 'Erreur lors de la mise à jour.' }) }
    finally { setSaving(false) }
  }

  async function changePassword() {
    if (!newPw || newPw.length < 6) { showToast({ type: 'err', msg: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }); return }
    setSaving(true)
    try {
      await apiFetch('/auth/change-password/', { method: 'POST', body: JSON.stringify({ old_password: oldPw, new_password: newPw }) })
      setOldPw(''); setNewPw(''); setPwOpen(false)
      showToast({ type: 'ok', msg: 'Mot de passe modifié avec succès.' })
    } catch (e: unknown) {
      const msg = (e as { error?: string })?.error ?? 'Erreur lors du changement de mot de passe.'
      showToast({ type: 'err', msg })
    }
    finally { setSaving(false) }
  }

  function syncToLocalStorage(updated: Me) {
    const stored = localStorage.getItem('dc_user')
    if (stored) localStorage.setItem('dc_user', JSON.stringify({ ...JSON.parse(stored), photo: updated.photo }))
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast({ type: 'err', msg: 'La photo ne doit pas dépasser 5 Mo.' }); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('photo', file)
      const updated = await apiUpload<Me>('/auth/photo/', fd)
      setMe(updated); syncToLocalStorage(updated)
      showToast({ type: 'ok', msg: 'Photo mise à jour.' })
    } catch { showToast({ type: 'err', msg: "Erreur lors du téléversement." }) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  async function removePhoto() {
    setUploading(true)
    try {
      const updated = await apiFetch<Me>('/auth/photo/', { method: 'DELETE' })
      setMe(updated); syncToLocalStorage(updated)
      showToast({ type: 'ok', msg: 'Photo supprimée.' })
    } catch { showToast({ type: 'err', msg: 'Erreur lors de la suppression.' }) }
    finally { setUploading(false) }
  }

  const initials = me ? (me.nom || me.login).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const photoUrl = me?.photo ? (me.photo.startsWith('http') ? me.photo : `${MEDIA_BASE}${me.photo}`) : null

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <style>{`
        .cp-card {
          background: #fff; border: 1px solid #f1f5f9; border-radius: 16px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.04); overflow: hidden;
        }
        .cp-card-head {
          padding: 1.25rem 1.5rem; border-bottom: 1px solid #f8fafc;
          display: flex; align-items: center; justify-content: space-between;
        }
        .cp-card-title { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
        .cp-card-sub   { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

        .cp-avatar-wrap {
          padding: 2rem 1.5rem 1.5rem;
          display: flex; align-items: center; gap: 1.5rem;
          border-bottom: 1px solid #f8fafc;
        }
        .cp-avatar-btn {
          position: relative; width: 72px; height: 72px; border-radius: 50%;
          flex-shrink: 0; cursor: pointer; border: none; padding: 0; background: none;
        }
        .cp-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #0E3358 0%, #1AAFE6 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; font-weight: 800; color: #fff;
          box-shadow: 0 4px 16px rgba(26,175,230,0.3);
          overflow: hidden; object-fit: cover;
        }
        .cp-avatar-overlay {
          position: absolute; inset: 0; border-radius: 50%;
          background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .cp-avatar-btn:hover .cp-avatar-overlay { opacity: 1; }
        .cp-avatar-btn:disabled { cursor: default; }
        .cp-avatar-btn:disabled .cp-avatar-overlay { opacity: uploading ? 0.6 : 0; }
        .cp-name { font-size: 1.25rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
        .cp-login { font-size: 0.8125rem; color: #94a3b8; margin-top: 2px; }
        .cp-role-pill {
          display: inline-flex; align-items: center;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em;
          background: rgba(26,175,230,0.08); color: #1AAFE6;
          border-radius: 20px; padding: 0.2rem 0.7rem; margin-top: 6px;
          text-transform: uppercase;
        }

        .cp-fields { padding: 0; }
        .cp-field {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.5rem; border-bottom: 1px solid #f8fafc;
        }
        .cp-field:last-child { border-bottom: none; }
        .cp-field-icon {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .cp-field-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
        .cp-field-val   { font-size: 0.875rem; font-weight: 600; color: #1e293b; margin-top: 2px; }

        /* Edit modal backdrop */
        .cp-modal-bg {
          position: fixed; inset: 0; background: rgba(15,23,42,0.4);
          backdrop-filter: blur(4px); z-index: 200;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .cp-modal {
          background: #fff; border-radius: 16px; width: 100%; max-width: 420px;
          box-shadow: 0 24px 48px rgba(15,23,42,0.15);
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .cp-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
        }
        .cp-modal-title { font-size: 0.9375rem; font-weight: 700; color: #0f172a; }
        .cp-modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .cp-modal-foot { padding: 1rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.5rem; }

        /* Form elements */
        .cp-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 5px; }
        .cp-input {
          width: 100%; height: 38px; padding: 0 0.75rem;
          border: 1px solid #e2e8f0; border-radius: 9px;
          font-size: 0.875rem; color: #1e293b; background: #fff;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .cp-input:focus { border-color: #1AAFE6; box-shadow: 0 0 0 3px rgba(26,175,230,0.1); }
        .cp-input-wrap { position: relative; }
        .cp-input-wrap .cp-input { padding-right: 2.5rem; }
        .cp-eye {
          position: absolute; right: 0.625rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px;
          display: flex; align-items: center;
        }
        .cp-eye:hover { color: #475569; }

        /* Buttons */
        .cp-btn {
          height: 36px; padding: 0 1rem; border-radius: 9px; font-size: 0.8125rem; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.15s; display: inline-flex; align-items: center; gap: 5px;
        }
        .cp-btn-primary { background: #1AAFE6; color: #fff; }
        .cp-btn-primary:hover { background: #1490c2; }
        .cp-btn-primary:disabled { opacity: 0.6; cursor: default; }
        .cp-btn-ghost { background: #f8fafc; color: #475569; border: 1px solid #f1f5f9; }
        .cp-btn-ghost:hover { background: #f1f5f9; }
        .cp-btn-outline { background: #fff; color: #475569; border: 1px solid #e2e8f0; }
        .cp-btn-outline:hover { background: #f8fafc; }

        /* Toast */
        .cp-toast {
          position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 300;
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.8125rem; font-weight: 600;
          box-shadow: 0 8px 24px rgba(15,23,42,0.12);
          animation: slideUp 0.2s ease;
        }
        .cp-toast.ok { background: #fff; border: 1px solid rgba(16,185,129,0.2); color: #065f46; }
        .cp-toast.err { background: #fff; border: 1px solid rgba(239,68,68,0.2); color: #991b1b; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`cp-toast ${toast.type}`}>
          {toast.type === 'ok' ? <CheckCircle2 size={15} color="#10b981" /> : <AlertTriangle size={15} color="#ef4444" />}
          {toast.msg}
        </div>
      )}

      {/* Profile card */}
      <div className="cp-card" style={{ marginBottom: '1rem' }}>
        {/* Avatar + identity */}
        <div className="cp-avatar-wrap">
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button className="cp-avatar-btn" disabled={uploading} onClick={() => fileRef.current?.click()} title="Changer la photo">
              {photoUrl
                ? <img src={photoUrl} alt="Photo de profil" className="cp-avatar" style={{ width: 72, height: 72, objectFit: 'cover' }} />
                : <div className="cp-avatar">{uploading ? '…' : initials}</div>
              }
              <div className="cp-avatar-overlay">
                <Camera size={18} color="#fff" />
              </div>
            </button>
            {photoUrl && (
              <button onClick={removePhoto} disabled={uploading}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, padding: '2px 6px' }}>
                <Trash2 size={11} /> Supprimer
              </button>
            )}
          </div>
          <div>
            <div className="cp-name">{me?.nom || me?.login || '—'}</div>
            <div className="cp-login">@{me?.login}</div>
            <div className="cp-role-pill">{me ? (ROLE_LABELS[me.role] ?? me.role) : ''}</div>
          </div>
        </div>

        {/* Fields */}
        <div className="cp-fields">
          {[
            { icon: User,  bg: 'rgba(26,175,230,0.08)',  color: '#1AAFE6', label: 'Nom complet',     val: me?.nom || '—' },
            { icon: Mail,  bg: 'rgba(16,185,129,0.08)',  color: '#10b981', label: 'Email',            val: me?.email || '—' },
            { icon: Lock,  bg: 'rgba(139,92,246,0.08)',  color: '#8b5cf6', label: 'Login',            val: me?.login || '—' },
          ].map(f => {
            const Icon = f.icon
            return (
              <div key={f.label} className="cp-field">
                <div className="cp-field-icon" style={{ background: f.bg }}>
                  <Icon size={15} style={{ color: f.color }} />
                </div>
                <div>
                  <div className="cp-field-label">{f.label}</div>
                  <div className="cp-field-val">{f.val}</div>
                </div>
              </div>
            )
          })}
          {(me?.university_name || me?.etablissement_name) && (
            <div className="cp-field">
              <div className="cp-field-icon" style={{ background: 'rgba(245,158,11,0.08)' }}>
                <User size={15} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <div className="cp-field-label">Institution</div>
                <div className="cp-field-val">{me.etablissement_name ?? me.university_name}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f8fafc', display: 'flex', gap: '0.625rem' }}>
          <button className="cp-btn cp-btn-primary" onClick={() => { setNom(me?.nom ?? ''); setEmail(me?.email ?? ''); setEditOpen(true) }}>
            <Pencil size={13} /> Modifier le profil
          </button>
          <button className="cp-btn cp-btn-ghost" onClick={() => { setOldPw(''); setNewPw(''); setPwOpen(true) }}>
            <Lock size={13} /> Changer le mot de passe
          </button>
        </div>
      </div>

      {/* Modal modifier profil */}
      {editOpen && (
        <div className="cp-modal-bg" onClick={e => { if (e.target === e.currentTarget) setEditOpen(false) }}>
          <div className="cp-modal">
            <div className="cp-modal-head">
              <span className="cp-modal-title">Modifier le profil</span>
              <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <div className="cp-modal-body">
              <div>
                <label className="cp-label">Nom complet</label>
                <input className="cp-input" value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom" />
              </div>
              <div>
                <label className="cp-label">Email</label>
                <input className="cp-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" />
              </div>
            </div>
            <div className="cp-modal-foot">
              <button className="cp-btn cp-btn-outline" onClick={() => setEditOpen(false)}>Annuler</button>
              <button className="cp-btn cp-btn-primary" onClick={saveProfile} disabled={saving}>
                {saving ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal changer mot de passe */}
      {pwOpen && (
        <div className="cp-modal-bg" onClick={e => { if (e.target === e.currentTarget) setPwOpen(false) }}>
          <div className="cp-modal">
            <div className="cp-modal-head">
              <span className="cp-modal-title">Changer le mot de passe</span>
              <button onClick={() => setPwOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 6, display: 'flex' }}>
                <X size={16} />
              </button>
            </div>
            <div className="cp-modal-body">
              <div>
                <label className="cp-label">Mot de passe actuel</label>
                <div className="cp-input-wrap">
                  <input className="cp-input" type={showOld ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="••••••••" />
                  <button type="button" className="cp-eye" onClick={() => setShowOld(v => !v)}>
                    {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="cp-label">Nouveau mot de passe</label>
                <div className="cp-input-wrap">
                  <input className="cp-input" type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 caractères" />
                  <button type="button" className="cp-eye" onClick={() => setShowNew(v => !v)}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {newPw.length > 0 && newPw.length < 6 && (
                  <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4 }}>Au moins 6 caractères requis</div>
                )}
              </div>
            </div>
            <div className="cp-modal-foot">
              <button className="cp-btn cp-btn-outline" onClick={() => setPwOpen(false)}>Annuler</button>
              <button className="cp-btn cp-btn-primary" onClick={changePassword} disabled={saving || newPw.length < 6}>
                {saving ? '…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '2rem' }} />
    </div>
  )
}
