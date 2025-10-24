import { Profile } from './types'

export type UserRole = 'admin' | 'croupier' | 'user' | 'anon'

export const hasRole = (profile: Profile | null, requiredRole: UserRole): boolean => {
  if (!profile) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    'anon': 0,
    'user': 1,
    'croupier': 2,
    'admin': 3
  }
  
  return roleHierarchy[profile.role] >= roleHierarchy[requiredRole]
}

export const isAdmin = (profile: Profile | null): boolean => {
  return hasRole(profile, 'admin')
}

export const isCroupier = (profile: Profile | null): boolean => {
  return hasRole(profile, 'croupier')
}

export const isUser = (profile: Profile | null): boolean => {
  return hasRole(profile, 'user')
}

export const canAccessAdmin = (profile: Profile | null): boolean => {
  return isAdmin(profile)
}

export const canManageMarkets = (profile: Profile | null): boolean => {
  return isAdmin(profile) || isCroupier(profile)
}
