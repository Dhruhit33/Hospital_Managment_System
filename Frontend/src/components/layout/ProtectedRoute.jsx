import React from 'react'
import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
}
