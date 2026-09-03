// Shared types, constants, and micro-components for admin sub-pages
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

/* ── Types ── */
export interface University    { id: number; code: string; libelle: string; email_contact: string; tel_contact: string; ville: string }
export interface Etablissement { id: number; code: string; libelle: string; university: number; university_name: string; email: string; tel: string; ville: string }
export interface AppUser       { id: number; login: string; nom: string; email: string; role: string; university: number; etablissement: number | null; etablissement_name: string | null; is_active: boolean }
export interface Annee         { id: number; libelle: string; is_active: boolean; etablissement: number }
export interface Cycle         { id: number; code: string; libelle: string; etablissement: number }
export interface Parcours      { id: number; code: string; libelle: string; etablissement: number; etablissement_libelle: string }
export interface Specialite    { id: number; code: string; libelle: string; cycle: number | null; cycle_libelle: string | null; parcours: number | null; parcours_libelle: string | null; etablissement: number }
export interface Semestre      { id: number; code: string; libelle: string; ordre: number; etablissement: number }
export interface Niveau        { id: number; code: string; libelle: string; ordre: number; etablissement: number }
export interface Abonnement    { id: number; university: number; university_name: string; university_code: string; statut: string; date_debut: string | null; date_fin: string | null; max_users: number; modules: string[]; notes: string; user_count: number; updated_at: string }
export interface LogEntry      { id: number; user_login: string; user_nom: string; action: string; action_label: string; description: string; ip: string | null; university_name: string | null; created_at: string }
export interface AdminStats    { universities: number; etablissements: number; users_total: number; abonnements: number; abonnes_actifs: number; connexions_today: number; connexions_yesterday: number; connexions_week: { date: string; count: number }[]; users_by_role: { role: string; count: number }[]; recent_logs: LogEntry[] }
export interface ApiList<T>    { count: number; results: T[] }

/* ── Constants ── */
export const ROLES = ['scolarité','doyen','enseignant','professeur','cours','inscription','anonymat','personnel','gesnote','soutenance','suivi','caisse','pvd']

export const ALL_MODULES = ['scolarite','inscription','notes','cours','anonymat','suivi','caisse','pvd','soutenance','personnel']

export const ABONNEMENT_STATUTS = [
  { value: 'actif',    label: 'Actif',     color: '#10b981' },
  { value: 'essai',    label: 'Essai',     color: '#f59e0b' },
  { value: 'expiré',  label: 'Expiré',    color: '#ef4444' },
  { value: 'suspendu', label: 'Suspendu',  color: '#6b7280' },
]

export const ROLE_COLORS: Record<string, string> = {
  'scolarité':'#EF4444',doyen:'#8b5cf6',enseignant:'#f59e0b',professeur:'#10b981',
  cours:'#06b6d4',inscription:'#3b82f6',anonymat:'#6366f1',personnel:'#ec4899',
  gesnote:'#14b8a6',soutenance:'#f97316',suivi:'#84cc16',caisse:'#eab308',pvd:'#a78bfa',
}

export const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  login:         { bg: 'rgba(239,68,68,0.1)',  color: '#EF4444' },
  logout:        { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
  create_user:   { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
  update_user:   { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
  delete_user:   { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  create_insc:   { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6' },
  reinscription: { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  create_classe: { bg: 'rgba(6,182,212,0.1)',   color: '#06b6d4' },
  create_ue:     { bg: 'rgba(249,115,22,0.1)',  color: '#f97316' },
  system:        { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
}

/* ── Micro-components ── */
export function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 mb-4">
      <AlertTriangle size={14} className="shrink-0" /> {msg}
    </div>
  )
}

export function ConfirmDialog({ open, msg, onYes, onNo }: { open: boolean; msg: string; onYes: () => void; onNo: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onNo()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={17} className="text-red-500" />
            </div>
            <DialogTitle>Confirmation</DialogTitle>
          </div>
          <DialogDescription>{msg}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={onNo}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={onYes}>Supprimer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export function ListRow({ icon: Icon, iconColor, iconBg, primary, secondary, onEdit, onDelete, isLast }: {
  icon: React.ElementType; iconColor: string; iconBg: string
  primary: string; secondary?: string
  onEdit: () => void; onDelete: () => void; isLast: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 group${!isLast ? ' border-b border-slate-50' : ''}`}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 text-sm truncate">{primary}</div>
        {secondary && <div className="text-xs text-slate-400 mt-0.5 truncate">{secondary}</div>}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
