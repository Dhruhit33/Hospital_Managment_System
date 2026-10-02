import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  LogOut,
  User as UserIcon,
  Search,
  Bell,
  HeartPulse,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CarePointLogo } from '@/components/shared/CarePointLogo'

export function Topbar({ onMenuClick, isCollapsed, onToggleCollapse }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const getPrimaryRole = useAuthStore((state) => state.getPrimaryRole)
  const [showUserMenu, setShowUserMenu] = useState(false)

  let currentPortal = 'PATIENT'
  let portalTitle = 'Patient Care Portal'
  if (location.pathname.startsWith('/admin')) {
    currentPortal = 'ADMIN'
    portalTitle = 'Hospital Operations Console'
  } else if (location.pathname.startsWith('/doctor')) {
    currentPortal = 'DOCTOR'
    portalTitle = 'Physician Clinical Console'
  }

  const role = getPrimaryRole() || currentPortal

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch (e) {
        console.warn('Logout request failed', e)
      }
    }
    logout()
    navigate('/login')
  }

  const userDisplayName = user?.name || user?.username?.split('@')[0] || 'CarePoint User'
  const userInitial = userDisplayName.charAt(0).toUpperCase()

  return (
    <header className="h-16 w-full glass-panel border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-all select-none">
      {/* Left: Brand + Sidebar Toggle + Portal Title */}
      <div className="flex items-center gap-3.5">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle button (collapse/expand) */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar width"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-blue-600" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        {/* Brand System Logo with Teal ECG Wave */}
        <CarePointLogo size="md" subtitle={portalTitle} className="hidden sm:flex" />
        <CarePointLogo size="md" iconOnly className="sm:hidden" />
      </div>

      {/* Middle: Universal Search Bar (Sleek Real-World Clinical SaaS Look) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            readOnly
            onClick={() => {
              if (currentPortal === 'PATIENT') navigate('/patient/records')
              else if (currentPortal === 'DOCTOR') navigate('/doctor/appointments')
              else navigate('/admin/users')
            }}
            placeholder={
              currentPortal === 'PATIENT'
                ? 'Search consultations, medical records, doctors...'
                : currentPortal === 'DOCTOR'
                ? 'Search patient records, appointments...'
                : 'Search users, doctors, departments...'
            }
            className="w-full h-9 pl-9 pr-14 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-700 placeholder-slate-400 rounded-xl border border-slate-200/90 focus:border-blue-400 focus:outline-none transition-all cursor-pointer"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Operational Status, Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Clinical System Status */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Clinical Network Online</span>
        </div>

        {/* Notifications Bell */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile Card & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 sm:pl-2.5 sm:pr-2 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200/60"
            aria-expanded={showUserMenu}
          >
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {userDisplayName}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">{role}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-white/20">
              {userInitial || <UserIcon className="w-4 h-4" />}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Popover Menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-lg py-2 z-40 animate-in fade-in-50 zoom-in-95">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{userDisplayName}</p>
                  <p className="text-[11px] text-slate-500 truncate font-mono">{user?.username}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={role} />
                  </div>
                </div>

                <div className="p-1">
                  {currentPortal === 'PATIENT' && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/patient/profile')
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      My Health Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleLogout()
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

Topbar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
}

Topbar.defaultProps = {
  isCollapsed: false,
  onToggleCollapse: () => {},
}
