import React from 'react'
import PropTypes from 'prop-types'
import { useLocation, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarPlus,
  Calendar,
  FileText,
  CreditCard,
  ShieldCheck,
  User,
  Clock,
  Users,
  Stethoscope,
  Building2,
  CalendarCheck,
  Receipt,
  ShieldAlert,
  X,
  HeartPulse,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { CarePointLogo } from '@/components/shared/CarePointLogo'

const iconMap = {
  LayoutDashboard,
  CalendarPlus,
  Calendar,
  FileText,
  CreditCard,
  ShieldCheck,
  User,
  Clock,
  Users,
  Stethoscope,
  Building2,
  CalendarCheck,
  Receipt,
  ShieldAlert,
}

export function Sidebar({ isOpen, onClose, isCollapsed }) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const getPrimaryRole = useAuthStore((state) => state.getPrimaryRole)

  // Determine current active section from URL
  let activeSection = 'PATIENT'
  if (location.pathname.startsWith('/admin')) {
    activeSection = 'ADMIN'
  } else if (location.pathname.startsWith('/doctor')) {
    activeSection = 'DOCTOR'
  } else if (location.pathname.startsWith('/patient')) {
    activeSection = 'PATIENT'
  }

  // Determine user capabilities across multiple roles
  const rawRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.activeRole
    ? [user.activeRole]
    : []
  const userRoles = rawRoles.map((r) => String(r).replace(/^ROLE_/, ''))
  const hasAdminRole = userRoles.includes('ADMIN') || user?.activeRole === 'ADMIN'
  const hasDoctorRole = userRoles.includes('DOCTOR') || user?.activeRole === 'DOCTOR'

  const links = NAV_LINKS[activeSection] || []
  const userDisplayName = user?.name || user?.username?.split('@')[0] || 'User'
  const userInitial = userDisplayName.charAt(0).toUpperCase()

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container positioned below topbar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/85 flex flex-col transition-all duration-300 ease-in-out md:static shadow-sm',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'md:w-20' : 'md:w-64',
          'w-64'
        )}
      >
        {/* Mobile Header (Close trigger) with Teal ECG Logo */}
        <div className="flex md:hidden items-center justify-between h-16 px-5 border-b border-slate-200">
          <CarePointLogo size="sm" showSubtitle={false} />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Workspace Label */}
        <div className={cn('px-4 pt-5 pb-2 transition-all', isCollapsed ? 'text-center' : '')}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                {activeSection} Workspace
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-50" />
            </div>
          ) : (
            <div className="flex justify-center" title={`${activeSection} Workspace`}>
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            </div>
          )}
        </div>

        {/* Main Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {links.map((link) => {
            const Icon = iconMap[link.icon] || LayoutDashboard
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                title={isCollapsed ? link.name : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl text-xs font-semibold transition-all group',
                    isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25 font-bold'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80'
                  )
                }
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform group-hover:scale-105',
                    isCollapsed ? 'w-5 h-5' : ''
                  )}
                />
                {!isCollapsed && <span>{link.name}</span>}
              </NavLink>
            )
          })}

          {/* DUAL-ROLE SWITCHER: ONLY IF USER IS BOTH ADMIN AND DOCTOR */}
          {hasAdminRole && hasDoctorRole && (
            <div className="pt-4 mt-3 border-t border-slate-200 space-y-1">
              {!isCollapsed && (
                <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1.5">
                  {location.pathname.startsWith('/admin') ? 'Clinical Workspace' : 'Operations Workspace'}
                </span>
              )}

              {/* If currently in Admin view, provide switch to Doctor Clinical Console */}
              {location.pathname.startsWith('/admin') && (
                <NavLink
                  to="/doctor/dashboard"
                  onClick={onClose}
                  title="Switch to Doctor Clinical Console"
                  className={cn(
                    'flex items-center gap-3 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-all border border-emerald-100 bg-emerald-50/40',
                    isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2'
                  )}
                >
                  <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
                  {!isCollapsed && <span>Doctor Console</span>}
                </NavLink>
              )}

              {/* If currently in Doctor view, provide switch to Admin Portal */}
              {location.pathname.startsWith('/doctor') && (
                <NavLink
                  to="/admin/dashboard"
                  onClick={onClose}
                  title="Switch to Admin Operations Console"
                  className={cn(
                    'flex items-center gap-3 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-all border border-amber-100 bg-amber-50/40',
                    isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2'
                  )}
                >
                  <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                  {!isCollapsed && <span>Admin Portal</span>}
                </NavLink>
              )}
            </div>
          )}
        </nav>

        {/* Footer Area: User Card & Security Badge ("Moved Down") */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {userInitial}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {userDisplayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-500 font-medium truncate">
                    {user?.activeRole || 'Online'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`${userDisplayName} (${user?.activeRole})`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {userInitial}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool,
}

Sidebar.defaultProps = {
  isCollapsed: false,
}
