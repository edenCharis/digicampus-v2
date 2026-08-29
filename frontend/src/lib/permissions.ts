import type { Role } from '@/types'

export const ROUTE_ROLES: Record<string, Role[]> = {
  '/administrateur': ['administrateur'],
  '/scolarite': ['scolarité', 'administrateur'],
  '/doyen': ['doyen', 'administrateur'],
  '/enseignant': ['enseignant', 'administrateur'],
  '/professeur': ['professeur', 'administrateur'],
  '/cours': ['cours', 'enseignant', 'professeur', 'administrateur'],
  '/inscription': ['inscription', 'scolarité', 'administrateur'],
  '/anonymat': ['anonymat', 'administrateur'],
  '/daarhspe': ['daarhspe', 'administrateur'],
  '/gesnote': ['gesnote', 'doyen', 'administrateur'],
  '/soutenance': ['soutenance', 'administrateur'],
  '/suivi': ['suivi', 'doyen', 'administrateur'],
  '/caisse': ['caisse', 'administrateur'],
  '/pvd': ['pvd', 'doyen', 'administrateur'],
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
    '/administrateur', '/scolarite', '/doyen', '/enseignant',
    '/cours', '/inscription', '/anonymat', '/daarhspe',
    '/gesnote', '/soutenance', '/suivi', '/caisse', '/pvd',
  ],
  'scolarité': ['/scolarite', '/inscription'],
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
