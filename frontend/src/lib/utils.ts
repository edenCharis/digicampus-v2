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
  daarhspe: 'DAARHSPE',
  gesnote: 'Gestion des Notes',
  soutenance: 'Soutenance',
  suivi: 'Suivi',
  caisse: 'Caisse',
  pvd: 'PVD',
}

export const ROLE_HOME: Record<string, string> = {
  administrateur: '/administrateur',
  'scolarité': '/scolarite',
  doyen: '/doyen',
  enseignant: '/enseignant',
  professeur: '/professeur',
  cours: '/cours',
  inscription: '/inscription',
  anonymat: '/anonymat',
  daarhspe: '/daarhspe',
  gesnote: '/gesnote',
  soutenance: '/soutenance',
  suivi: '/suivi',
  caisse: '/caisse',
  pvd: '/pvd',
}
