import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ROLE_LABELS: Record<string, string> = {
  administrateur: 'Administrateur',
  'scolarité': 'Scolarité',
  doyen: 'Doyen',
  enseignant: 'Enseignant',
  professeur: 'Professeur',
  cours: 'Cours',
  inscription: 'Inscription',
  anonymat: 'Anonymat',
  personnel: 'Personnel',
  gesnote: 'Gestion des Notes',
  soutenance: 'Soutenance',
  suivi: 'Suivi',
  caisse: 'Caisse',
  pvd: 'PVD',
}

// Re-export from permissions for backward compat
export { ROLE_HOME } from './permissions'
