export type Role =
  | 'administrateur'
  | 'scolarité'
  | 'doyen'
  | 'enseignant'
  | 'professeur'
  | 'cours'
  | 'inscription'
  | 'anonymat'
  | 'personnel'
  | 'gesnote'
  | 'soutenance'
  | 'suivi'
  | 'caisse'
  | 'pvd'

export interface University {
  id: number
  code: string
  libelle: string
  logo: string | null
  email_contact: string
  tel_contact: string
  ville: string
}

export interface Etablissement {
  id: number
  code: string
  libelle: string
  university: number
  university_name: string
  logo: string | null
  email: string
  tel: string
  ville: string
}

export interface AppUser {
  id: number
  login: string
  nom: string
  email: string
  photo: string | null
  role: Role
  university: number | null
  university_name: string | null
  etablissement: number | null
  etablissement_name: string | null
  is_active: boolean
}

export interface AuthTokens {
  access: string
  refresh: string
  user: AppUser
}

export interface ApiError {
  detail?: string
  [key: string]: unknown
}
