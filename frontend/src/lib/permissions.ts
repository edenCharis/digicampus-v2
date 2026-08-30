import type { Role } from '@/types'

export const ROUTE_ROLES: Record<string, Role[]> = {
  '/administrateur': ['administrateur'],
  '/administrateur/annees': ['administrateur'],
  '/administrateur/cycles': ['administrateur'],
  '/administrateur/parcours': ['administrateur'],
  '/administrateur/specialites': ['administrateur'],
  '/administrateur/semestres': ['administrateur'],
  '/administrateur/niveaux': ['administrateur'],
  '/scolarite':  ['scolarité'],
  '/scolarite/inscriptions': ['scolarité'],
  '/scolarite/etudiants':    ['scolarité'],
  '/scolarite/classes':      ['scolarité'],
  '/scolarite/ues':          ['scolarité'],
  '/scolarite/enseignants':  ['scolarité'],
  '/scolarite/cycles':       ['scolarité'],
  '/scolarite/parcours':     ['scolarité'],
  '/scolarite/specialites':  ['scolarité'],
  '/scolarite/ecues':        ['scolarité'],
  '/doyen':      ['doyen'],
  '/enseignant': ['enseignant'],
  '/professeur': ['professeur'],
  '/cours':      ['cours', 'enseignant', 'professeur'],
  '/inscription':['inscription', 'scolarité'],
  '/anonymat':   ['anonymat'],
  '/daarhspe':   ['daarhspe'],
  '/gesnote':    ['gesnote', 'doyen'],
  '/soutenance': ['soutenance'],
  '/suivi':      ['suivi', 'doyen'],
  '/caisse':     ['caisse'],
  '/pvd':        ['pvd', 'doyen'],
}

export function canAccess(role: Role, pathname: string): boolean {
  // Find the most specific matching prefix
  const match = Object.keys(ROUTE_ROLES)
    .filter(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))
    .sort((a, b) => b.length - a.length)[0]

  if (!match) return true // no restriction defined → open to all authenticated users
  return ROUTE_ROLES[match].includes(role)
}

// Where each role lands after login
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

// Nav items each role sees in the sidebar
export const ROLE_NAV: Record<Role, string[]> = {
  administrateur: [
    '/administrateur',
    '/administrateur/universites',
    '/administrateur/etablissements',
    '/administrateur/comptes',
    '/administrateur/abonnements',
    '/administrateur/logs',
    '/administrateur/parametrage',
    '/administrateur/annees',
    '/administrateur/cycles',
    '/administrateur/parcours',
    '/administrateur/specialites',
    '/administrateur/semestres',
    '/administrateur/niveaux',
  ],
  'scolarité': [
    '/scolarite',
    '/scolarite/inscriptions',
    '/scolarite/etudiants',
    '/scolarite/enseignants',
    '/scolarite/cycles',
    '/scolarite/parcours',
    '/scolarite/specialites',
    '/scolarite/ues',
    '/scolarite/ecues',
    '/scolarite/classes',
  ],
  doyen: ['/doyen', '/gesnote', '/suivi', '/pvd'],
  enseignant: ['/enseignant', '/cours'],
  professeur: ['/professeur', '/cours'],
  cours: ['/cours'],
  inscription: ['/inscription'],
  anonymat: ['/anonymat'],
  daarhspe: ['/daarhspe'],
  gesnote: ['/gesnote'],
  soutenance: ['/soutenance'],
  suivi: ['/suivi'],
  caisse: ['/caisse'],
  pvd: ['/pvd'],
}
