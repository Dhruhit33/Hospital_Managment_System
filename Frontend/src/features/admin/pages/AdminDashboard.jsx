import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Stethoscope,
  Calendar,
  CreditCard,
  Building2,
  TrendingUp,
  Droplet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  UserCheck,
  ChevronRight,
  Activity,
  Layers,
  Sparkles,
  BarChart3,
  Server,
  Settings,
  Crown,
  UserPlus,
  Shield,
  Briefcase,
  Award,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import { departmentsApi } from '@/api/departments'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function AdminDashboard() {
  const queryClient = useQueryClient()
  const [actionMessage, setActionMessage] = useState('')

  // 1. Live Dashboard Metrics from backend
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
  })

  // 2. Real Registered Users from app_user
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-dashboard-users'],
    queryFn: () => adminApi.getUsers({ page: 0, size: 8 }),
  })

  // 3. Real Clinical Departments
  const { data: deptData, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['admin-dashboard-departments'],
    queryFn: () => departmentsApi.getDepartments({ page: 0, size: 8 }),
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, roles }) => adminApi.updateUserRoles(userId, roles),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setActionMessage(`Successfully updated authorization for User #${variables.userId}`)
      setTimeout(() => setActionMessage(''), 4000)
    },
    onError: (err) => {
      setActionMessage(err.response?.data?.message || 'Failed to update user role.')
      setTimeout(() => setActionMessage(''), 4000)
    },
  })

  const handlePromoteToDoctor = (user) => {
    const existing = Array.isArray(user.roles) ? user.roles : []
    const filtered = existing.filter((r) => r !== 'PATIENT')
    const updated = Array.from(new Set([...filtered, 'DOCTOR']))
    roleMutation.mutate({ userId: user.id, roles: updated })
  }

  const handlePromoteToAdmin = (user) => {
    const existing = Array.isArray(user.roles) ? user.roles : []
    const filtered = existing.filter((r) => r !== 'PATIENT')
    const updated = Array.from(new Set([...filtered, 'ADMIN']))
    roleMutation.mutate({ userId: user.id, roles: updated })
  }

  const handleRevertToPatient = (user) => {
    roleMutation.mutate({ userId: user.id, roles: ['PATIENT'] })
  }

  const stats = dashboard || {
    totalPatients: 0,
    totalDoctors: 0,
    totalUsers: 0,
    totalAdmins: 0,
    totalDepartments: 0,
    appointmentsToday: 0,
    revenueThisMonth: 0,
    pendingBillsCount: 0,
    appointmentsByStatus: {},
    appointmentsPerDoctor: [],
    bloodGroupCounts: [],
  }

  const statusMap = stats.appointmentsByStatus || {}
  const recentUsers = Array.isArray(usersData?.content)
    ? usersData.content
    : Array.isArray(usersData)
    ? usersData
    : []

  const departments = Array.isArray(deptData?.content)
    ? deptData.content
    : Array.isArray(deptData)
    ? deptData
    : []

  const totalLifecycleAppointments =
    (statusMap.BOOKED || 0) +
    (statusMap.CONFIRMED || 0) +
    (statusMap.COMPLETED || 0) +
    (statusMap.CANCELLED || 0) +
    (statusMap.NO_SHOW || 0)

  return (
    <div className="space-y-6 pb-12">
      {/* 1. EXECUTIVE COMMAND CONSOLE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Clinical & Institutional ERP • Real-time Sync
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              Hospital Operations Command Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Institutional executive governance: monitor real-time registered accounts, regulate staff authority, supervise clinical departments, and oversee hospital throughput.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/admin/users">
              <Button className="h-10 px-4 rounded-xl text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                Staff Role Authority
              </Button>
            </Link>
            <Link to="/admin/doctors">
              <Button variant="outline" className="h-10 px-3.5 rounded-xl text-xs font-bold gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                Doctor Registry
              </Button>
            </Link>
            <Link to="/admin/departments">
              <Button variant="outline" className="h-10 px-3.5 rounded-xl text-xs font-bold gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Building2 className="w-4 h-4 text-sky-400" />
                Departments
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl text-xs flex items-center gap-2.5 font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
      ) : (
        <>
          {/* 2. REAL-TIME BENTO KPI MATRIX (Live DB Stats) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Registered Users */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-hover-effect flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    System Accounts
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                    {stats.totalUsers ?? recentUsers.length ?? 0}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md text-[10px]">
                  {stats.totalAdmins || 1} Admins
                </span>
                <Link to="/admin/users" className="font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5">
                  Authority <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Active Doctors on Staff */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-hover-effect flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Active Doctors
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                    {stats.totalDoctors ?? 0}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                  Clinical Staff
                </span>
                <Link to="/admin/doctors" className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                  Registry <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Patient Census */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-hover-effect flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Patient Census
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                    {stats.totalPatients ?? 0}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-md text-[10px]">
                  Registered
                </span>
                <Link to="/admin/patients" className="font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5">
                  Directory <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Departments */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-hover-effect flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Departments
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                    {stats.totalDepartments ?? departments.length ?? 0}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md text-[10px]">
                  Clinical Units
                </span>
                <Link to="/admin/departments" className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
                  Manage <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Monthly Clinic Revenue */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs card-hover-effect flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Facility Revenue
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                    ${Number(stats.revenueThisMonth || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md text-[10px]">
                  This Month
                </span>
                <Link to="/admin/bills" className="font-bold text-teal-700 hover:text-teal-800 flex items-center gap-0.5">
                  Billing <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* 3. STAFF AUTHORITY & REAL USER ACCOUNTS QUICK MATRIX */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  System User Directory & Role Authority Matrix
                </h2>
                <p className="text-xs text-slate-500">
                  Live accounts stored in database ({recentUsers.length} shown). Admin can assign doctor positions, grant admin rights, or demote roles.
                </p>
              </div>
              <Link to="/admin/users">
                <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 h-8">
                  View All Accounts ({stats.totalUsers ?? recentUsers.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="p-6">
              {isLoadingUsers ? (
                <div className="py-8 flex justify-center"><LoadingSpinner /></div>
              ) : recentUsers.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No registered accounts found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentUsers.map((u) => {
                    const roles = Array.isArray(u.roles) ? u.roles : []
                    const isDoctor = roles.includes('DOCTOR')
                    const isAdmin = roles.includes('ADMIN')
                    const isPredefinedMainAdmin =
                      u.isPredefinedAdmin === true ||
                      u.username?.toLowerCase() === 'admin@hospital.com' ||
                      u.id === 1

                    return (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="overflow-hidden pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 truncate block">
                                {u.name || u.username}
                              </span>
                              {isPredefinedMainAdmin && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500" /> Main Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block truncate mt-0.5">
                              {u.username} • ID: #{u.id}
                            </span>
                            {isDoctor && u.specialization && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                                <Stethoscope className="w-2.5 h-2.5 text-emerald-600" /> {u.specialization}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 shrink-0">
                            {roles.map((r) => (
                              <StatusBadge key={r} status={r} />
                            ))}
                          </div>
                        </div>

                        {/* Quick role actions */}
                        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5 items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {!isDoctor && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-7 px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-semibold"
                                onClick={() => handlePromoteToDoctor(u)}
                                disabled={roleMutation.isPending}
                              >
                                <Stethoscope className="w-3 h-3 mr-1" />
                                Make Doctor
                              </Button>
                            )}
                            {!isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-7 px-2 text-purple-700 border-purple-200 hover:bg-purple-50 font-semibold"
                                onClick={() => handlePromoteToAdmin(u)}
                                disabled={roleMutation.isPending}
                              >
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Make Admin
                              </Button>
                            )}
                            {(isDoctor || (isAdmin && !isPredefinedMainAdmin)) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] h-7 px-2 text-rose-700 border-rose-200 hover:bg-rose-50 font-semibold"
                                onClick={() => handleRevertToPatient(u)}
                                disabled={roleMutation.isPending}
                              >
                                <ArrowRightLeft className="w-3 h-3 mr-1" />
                                Revert
                              </Button>
                            )}
                          </div>

                          <Link to="/admin/users" className="text-[10px] text-muted-foreground hover:text-primary font-medium flex items-center gap-0.5">
                            Details <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. CLINICAL WORKFLOW PIPELINE & CLINICAL DEPARTMENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consultation Lifecycle Funnel */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Appointment Lifecycle & Clinical Pipeline
                  </h2>
                  <p className="text-xs text-slate-500">Live progression across consultation stages</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {totalLifecycleAppointments} Total Logged
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
                    Booked
                  </span>
                  <span className="text-2xl font-extrabold text-blue-900 mt-0.5 block">
                    {statusMap.BOOKED || 0}
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">Pending triage</span>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 block">
                    Confirmed
                  </span>
                  <span className="text-2xl font-extrabold text-teal-900 mt-0.5 block">
                    {statusMap.CONFIRMED || 0}
                  </span>
                  <span className="text-[10px] text-teal-600 font-medium">In daily schedule</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                    Completed
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-900 mt-0.5 block">
                    {statusMap.COMPLETED || 0}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">Treated & cleared</span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">
                    Cancelled
                  </span>
                  <span className="text-2xl font-extrabold text-rose-900 mt-0.5 block">
                    {statusMap.CANCELLED || 0}
                  </span>
                  <span className="text-[10px] text-rose-600 font-medium">Withdrawn visits</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                    No-Show
                  </span>
                  <span className="text-2xl font-extrabold text-amber-900 mt-0.5 block">
                    {statusMap.NO_SHOW || 0}
                  </span>
                  <span className="text-[10px] text-amber-600 font-medium">Unattended slots</span>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">
                    Visits Today
                  </span>
                  <span className="text-2xl font-extrabold text-purple-900 mt-0.5 block">
                    {stats.appointmentsToday || 0}
                  </span>
                  <span className="text-[10px] text-purple-600 font-medium">Scheduled today</span>
                </div>
              </div>
            </div>

            {/* Clinical Departments Overview */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Hospital Clinical Divisions & Departments
                  </h2>
                  <p className="text-xs text-slate-500">Supervised medical units and active clinical staff</p>
                </div>
                <Link to="/admin/departments" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Manage <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {isLoadingDepts ? (
                <div className="py-6 flex justify-center"><LoadingSpinner /></div>
              ) : departments.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No departments recorded.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {departments.slice(0, 4).map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate block">
                          {d.name}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">
                          {d.doctorCount ?? d.doctors?.length ?? 0} Doctors
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                        <Award className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">
                          Head: <strong className="text-slate-700">{d.headDoctorName || 'Not Designated'}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 5. BLOOD BANK & DEMOGRAPHICS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-600" />
                  Hospital Blood Group Registry & Patient Demographics
                </h3>
                <p className="text-[11px] text-slate-500">
                  Real distribution of registered clinical patients by ABO blood groups
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Total Patients: <strong className="text-slate-800">{stats.totalPatients || 0}</strong>
              </span>
            </div>
            <div className="p-6">
              {!stats.bloodGroupCounts || stats.bloodGroupCounts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No patient blood groups registered yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                  {stats.bloodGroupCounts.map((bg, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-rose-200/80 bg-rose-50/50 text-center"
                    >
                      <span className="font-mono text-xl font-black text-rose-700 block">
                        {bg.bloodGroup}
                      </span>
                      <span className="text-[11px] text-slate-600 mt-0.5 block font-semibold">
                        {bg.count} {bg.count === 1 ? 'Patient' : 'Patients'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
