import { create } from 'zustand'

const STORAGE_KEY = 'carepoint_auth'

const loadInitialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        user: data.user || null,
        token: data.token || null,
        refreshToken: data.refreshToken || null,
        isAuthenticated: !!data.token,
      }
    }
  } catch (e) {
    console.error('Failed to parse auth storage', e)
  }
  return {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
  }
}

const initial = loadInitialState()

export const useAuthStore = create((set, get) => ({
  user: initial.user,
  token: initial.token,
  refreshToken: initial.refreshToken,
  isAuthenticated: initial.isAuthenticated,

  /**
   * Universal setter accepting either an object or multiple arguments:
   * setAuth({ user, token, refreshToken }) OR setAuth(user, token, refreshToken)
   */
  setAuth: (firstArg, secondArg, thirdArg) => {
    let user = null
    let token = null
    let refreshToken = null

    if (firstArg && typeof firstArg === 'object' && ('user' in firstArg || 'token' in firstArg)) {
      user = firstArg.user || null
      token = firstArg.token || null
      refreshToken = firstArg.refreshToken || null
    } else {
      user = firstArg || null
      token = secondArg || null
      refreshToken = thirdArg || (user && user.refreshToken) || null
    }

    if (user) {
      const rawRoles = user.roles || (user.activeRole ? [user.activeRole] : ['PATIENT'])
      const cleanRoles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map((r) =>
        String(r).replace(/^ROLE_/, '')
      )
      user = {
        ...user,
        roles: cleanRoles,
        activeRole: user.activeRole
          ? String(user.activeRole).replace(/^ROLE_/, '')
          : cleanRoles[0] || 'PATIENT',
      }
    }

    const newState = {
      user,
      token,
      refreshToken: refreshToken || get().refreshToken,
      isAuthenticated: !!token,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    } catch (e) {
      console.error('Failed to save auth state', e)
    }
    set(newState)
  },

  updateTokens: ({ token, refreshToken }) => {
    const currentState = get()
    const newState = {
      ...currentState,
      token,
      refreshToken: refreshToken || currentState.refreshToken,
      isAuthenticated: !!token,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    } catch (e) {
      console.error('Failed to save auth tokens', e)
    }
    set(newState)
  },

  updateUser: (userData) => {
    const currentState = get()
    if (!currentState.user) return
    const updatedUser = {
      ...currentState.user,
      ...userData,
    }
    const newState = {
      ...currentState,
      user: updatedUser,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    } catch (e) {
      console.error('Failed to update user', e)
    }
    set(newState)
  },

  switchRole: (role) => {
    const currentUser = get().user
    const cleanRole = String(role).replace(/^ROLE_/, '')
    const updatedUser = {
      ...(currentUser || { id: 1, username: 'user@hospital.com' }),
      activeRole: cleanRole,
      roles: Array.from(new Set([...(currentUser?.roles || []), cleanRole])),
    }
    const newState = { ...get(), user: updatedUser }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    } catch (e) {
      console.error('Failed to update active role', e)
    }
    set(newState)
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Failed to clear storage', e)
    }
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    })
  },

  hasRole: (targetRole) => {
    const user = get().user
    if (!user) return false
    const cleanTarget = String(targetRole).replace(/^ROLE_/, '')
    // Admin has superuser access to all portals
    if (user.activeRole === 'ADMIN' || user.roles?.includes('ADMIN')) return true
    if (user.activeRole === cleanTarget) return true
    if (Array.isArray(user.roles)) {
      const normalized = user.roles.map((r) => String(r).replace(/^ROLE_/, ''))
      return normalized.includes(cleanTarget)
    }
    return false
  },

  getPrimaryRole: () => {
    const user = get().user
    if (!user) return null
    if (user.activeRole) return String(user.activeRole).replace(/^ROLE_/, '')
    if (!user.roles || user.roles.length === 0) return 'PATIENT'
    const normalized = user.roles.map((r) => String(r).replace(/^ROLE_/, ''))
    if (normalized.includes('ADMIN')) return 'ADMIN'
    if (normalized.includes('DOCTOR')) return 'DOCTOR'
    if (normalized.includes('PATIENT')) return 'PATIENT'
    return normalized[0]
  },
}))
