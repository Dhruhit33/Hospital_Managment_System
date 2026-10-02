import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'

export function AppShell() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  // Silently refresh user profile (e.g. name, user_name) from /auth/me
  useEffect(() => {
    let isMounted = true
    authApi
      .getMe()
      .then((me) => {
        if (isMounted && me && me.name) {
          updateUser({ name: me.name })
        }
      })
      .catch(() => {
        // Silently catch for offline or cached sessions
      })
    return () => {
      isMounted = false
    }
  }, [updateUser])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-medical-canvas text-slate-900">
      {/* Full-width Topbar across the top */}
      <Topbar
        onMenuClick={() => setIsMobileOpen((prev) => !prev)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Main layout body: Sidebar below topbar + Main viewport */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Slide bar (Sidebar) positioned below topbar */}
        <Sidebar
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
          isCollapsed={isCollapsed}
        />

        {/* Scrollable page content viewport */}
        <main className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
