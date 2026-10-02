import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function RoleGuard({ role, children }) {
  const user = useAuthStore((state) => state.user)
  const switchRole = useAuthStore((state) => state.switchRole)

  const rawRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.activeRole
    ? [user.activeRole]
    : []
  const cleanRoles = rawRoles.map((r) => String(r).replace(/^ROLE_/, ''))
  const cleanTarget = String(role).replace(/^ROLE_/, '')

  // Authorization check:
  // ADMIN has full authority to visit all portals
  const isAdmin = cleanRoles.includes('ADMIN') || user?.activeRole === 'ADMIN'
  const isDoctor = cleanRoles.includes('DOCTOR') || user?.activeRole === 'DOCTOR'

  let isAuthorized = false
  if (cleanTarget === 'ADMIN') {
    isAuthorized = isAdmin
  } else if (cleanTarget === 'DOCTOR') {
    isAuthorized = isAdmin || isDoctor
  } else if (cleanTarget === 'PATIENT') {
    isAuthorized = true
  }

  // Automatically synchronize active role if authorized
  useEffect(() => {
    if (isAuthorized && user && user.activeRole !== cleanTarget) {
      switchRole(cleanTarget)
    }
  }, [isAuthorized, cleanTarget, user, switchRole])

  if (!isAuthorized) {
    // If not authorized to visit this portal, redirect to patient or doctor dashboard
    const fallback = isDoctor ? '/doctor/dashboard' : '/patient/dashboard'
    return <Navigate to={fallback} replace />
  }

  return children
}

RoleGuard.propTypes = {
  role: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}
