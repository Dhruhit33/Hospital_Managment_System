import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldAlert,
  UserCheck,
  UserX,
  Shield,
  Edit,
  CheckCircle2,
  AlertCircle,
  Users,
  Stethoscope,
  ShieldCheck,
  User,
  ArrowRightLeft,
  UserPlus,
  Crown,
  Lock,
  Search,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { adminApi } from '@/api/admin'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export const CLINICAL_SPECIALIZATIONS = [
  { label: 'Cardiology (Heart & Vascular)', value: 'Cardiology' },
  { label: 'Neurology (Brain & Nervous System)', value: 'Neurology' },
  { label: 'Pediatrics (Children & Infants)', value: 'Pediatrics' },
  { label: 'Orthopedics (Bones & Joints)', value: 'Orthopedics' },
  { label: 'General Medicine (Internal Medicine)', value: 'General Medicine' },
  { label: 'Dermatology (Skin & Aesthetics)', value: 'Dermatology' },
  { label: 'Radiology & Medical Imaging', value: 'Radiology' },
  { label: 'General Surgery', value: 'General Surgery' },
  { label: 'Emergency Medicine (Trauma & ER)', value: 'Emergency Medicine' },
  { label: 'Oncology (Cancer Specialist)', value: 'Oncology' },
  { label: 'Gynecology & Obstetrics (OB-GYN)', value: 'Gynecology' },
  { label: 'Psychiatry & Mental Health', value: 'Psychiatry' },
  { label: 'Ophthalmology (Eye Care)', value: 'Ophthalmology' },
  { label: 'ENT / Otorhinolaryngology', value: 'ENT' },
  { label: 'Gastroenterology (Digestive Health)', value: 'Gastroenterology' },
  { label: 'Nephrology (Kidney Care)', value: 'Nephrology' },
  { label: 'Pulmonology (Lungs & Respiratory)', value: 'Pulmonology' },
  { label: 'Urology (Urinary Tract & Surgery)', value: 'Urology' },
  { label: 'Anesthesiology & Critical Care', value: 'Anesthesiology' },
  { label: 'Pathology & Diagnostic Laboratory', value: 'Pathology' },
  { label: 'Other / Custom Specialization...', value: 'CUSTOM' },
]

export function UserAccessControlPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const isCurrentMainAdmin =
    currentUser?.username?.toLowerCase() === 'admin@hospital.com' ||
    currentUser?.id === 1 ||
    currentUser?.isPredefinedAdmin === true

  const [roleFilter, setRoleFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [onboardModalOpen, setOnboardModalOpen] = useState(false)
  const [onboardData, setOnboardData] = useState({
    userId: '',
    name: '',
    specialization: 'General Medicine',
    customSpecialization: '',
    email: '',
  })
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'ADMIN',
    specialization: 'General Medicine',
    customSpecialization: '',
  })
  const [alert, setAlert] = useState({ type: '', text: '' })

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => adminApi.getUsers({ role: roleFilter || undefined, page: 0, size: 100 }),
  })

  // Create user mutation (admin creating another admin, doctor, or patient)
  const createUserMutation = useMutation({
    mutationFn: (data) => adminApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setCreateUserModalOpen(false)
      setNewUserData({
        name: '',
        username: '',
        password: '',
        role: 'ADMIN',
        specialization: 'General Physician',
      })
      setAlert({
        type: 'success',
        text: 'New user/staff account created successfully!',
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create user account.',
      })
    },
  })

  // Update roles mutation (Section 9.5 sends raw JSON array)
  const roleMutation = useMutation({
    mutationFn: ({ userId, roles }) => adminApi.updateUserRoles(userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setRoleModalOpen(false)
      setAlert({ type: 'success', text: 'User roles updated successfully.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update roles.',
      })
    },
  })

  // Onboard doctor mutation
  const onboardDoctorMutation = useMutation({
    mutationFn: (data) => adminApi.onboardDoctor(data),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setOnboardModalOpen(false)
      setAlert({
        type: 'success',
        text: `Doctor ${newDoc.name || ''} successfully onboarded and granted DOCTOR privileges!`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to onboard doctor.',
      })
    },
  })

  // Disable user mutation (Section 9.6)
  const disableMutation = useMutation({
    mutationFn: (userId) => adminApi.disableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setAlert({ type: 'success', text: 'User account disabled.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to disable user.',
      })
    },
  })

  // Enable user mutation (Section 9.7)
  const enableMutation = useMutation({
    mutationFn: (userId) => adminApi.enableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setAlert({ type: 'success', text: 'User account enabled.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to enable user.',
      })
    },
  })

  const handleOpenEditRoles = (user) => {
    setSelectedUser(user)
    setSelectedRoles(Array.isArray(user.roles) ? [...user.roles] : ['PATIENT'])
    setRoleModalOpen(true)
    setAlert({ type: '', text: '' })
  }

  const handleOpenOnboardDoctor = (user) => {
    const isStandardSpec = user.specialization && CLINICAL_SPECIALIZATIONS.some((s) => s.value === user.specialization)
    const initialSpec = isStandardSpec
      ? user.specialization
      : user.specialization
      ? 'CUSTOM'
      : 'General Medicine'

    setOnboardData({
      userId: user.id,
      name: user.name || user.username?.split('@')[0] || `Dr. ${user.username}`,
      specialization: initialSpec,
      customSpecialization: !isStandardSpec && user.specialization ? user.specialization : '',
      email: user.username?.includes('@') ? user.username : `${user.username}@hospital.com`,
    })
    setOnboardModalOpen(true)
    setAlert({ type: '', text: '' })
  }

  const handlePromoteToAdmin = (user) => {
    const existing = Array.isArray(user.roles) ? user.roles : []
    // Auto remove PATIENT role when becoming ADMIN
    const filtered = existing.filter((r) => r !== 'PATIENT')
    const updated = Array.from(new Set([...filtered, 'ADMIN']))
    roleMutation.mutate({ userId: user.id, roles: updated })
  }

  const handleDemoteToPatient = (user) => {
    const isTargetMainAdmin =
      user.isPredefinedAdmin === true ||
      user.username?.toLowerCase() === 'admin@hospital.com' ||
      user.id === 1

    if (isTargetMainAdmin) {
      setAlert({ type: 'error', text: 'The Predefined Main Admin cannot be removed or demoted.' })
      return
    }

    const isTargetAdmin = Array.isArray(user.roles) && user.roles.includes('ADMIN')
    if (isTargetAdmin && !isCurrentMainAdmin) {
      setAlert({
        type: 'error',
        text: 'User Admins cannot remove or demote other administrators. Only the Predefined Main Admin has this authority.',
      })
      return
    }

    if (confirm(`Convert ${user.username} to standard Patient role? This will revoke Doctor/Admin access.`)) {
      roleMutation.mutate({ userId: user.id, roles: ['PATIENT'] })
    }
  }

  const toggleRole = (r) => {
    if (selectedRoles.includes(r)) {
      if (selectedRoles.length === 1) return // at least one role
      if (r === 'ADMIN') {
        const isTargetMainAdmin =
          selectedUser?.isPredefinedAdmin === true ||
          selectedUser?.username?.toLowerCase() === 'admin@hospital.com' ||
          selectedUser?.id === 1

        if (isTargetMainAdmin) {
          setAlert({ type: 'error', text: 'The Predefined Main Admin role cannot be removed.' })
          return
        }

        if (!isCurrentMainAdmin) {
          setAlert({
            type: 'error',
            text: 'User Admins cannot remove or demote other administrators. Only the Predefined Main Admin has this authority.',
          })
          return
        }
      }
      const newRoles = selectedRoles.filter((item) => item !== r)
      setSelectedRoles(newRoles.length > 0 ? newRoles : ['PATIENT'])
    } else {
      let newRoles = [...selectedRoles, r]
      // User requirement: if given Doctor or Admin role, auto remove Patient role
      if (r === 'DOCTOR' || r === 'ADMIN') {
        newRoles = newRoles.filter((role) => role !== 'PATIENT')
      }
      // If given Patient role, auto remove Doctor and Admin
      if (r === 'PATIENT') {
        newRoles = ['PATIENT']
      }
      setSelectedRoles(newRoles)
    }
  }

  const rawUsers = Array.isArray(usersData?.content)
    ? usersData.content
    : Array.isArray(usersData)
    ? usersData
    : []

  const totalCount = rawUsers.length
  const adminCount = rawUsers.filter((u) => Array.isArray(u.roles) && u.roles.includes('ADMIN')).length
  const doctorCount = rawUsers.filter((u) => Array.isArray(u.roles) && u.roles.includes('DOCTOR')).length
  const patientCount = rawUsers.filter((u) => Array.isArray(u.roles) && u.roles.includes('PATIENT')).length

  const users = rawUsers.filter((u) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const nameMatch = u.name?.toLowerCase().includes(q)
    const usernameMatch = u.username?.toLowerCase().includes(q)
    const idMatch = String(u.id).includes(q)
    const specMatch = u.specialization?.toLowerCase().includes(q)
    return nameMatch || usernameMatch || idMatch || specMatch
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Staff & User Role Authority
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Hospital Operations Console: inspect all system users, manage clinical authority, and configure access permissions.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setCreateUserModalOpen(true)
            setAlert({ type: '', text: '' })
          }}
          className="gap-1.5 shadow-xs text-xs font-semibold"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Create Staff Account
        </Button>
      </div>

      {/* Role Authority Guidelines Banner */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5 text-xs">
        <div className="flex items-center gap-2 text-primary font-bold">
          <Shield className="w-4 h-4" />
          <span>Role Authority & Hierarchy Matrix</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-700">
          <div className="p-3 rounded-lg bg-white/90 border border-amber-200/80 space-y-1">
            <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-400" /> Predefined Main Admin
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Full authority: remove departments, onboard doctors, add admins, remove admin positions (demote any admin), and disable users. Protected from demotion.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/90 border border-purple-200/80 space-y-1">
            <span className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> User Admin
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Operational oversight: onboard staff, manage records, promote users. <strong className="text-purple-950">Cannot remove or demote other administrators.</strong>
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/90 border border-emerald-200/80 space-y-1">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Doctor
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Clinical consultations & queue triage. Can discharge their assigned patients, but cannot modify staff, other doctors, or other doctors' patients.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setRoleFilter('')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            roleFilter === ''
              ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30'
              : 'bg-card border-border hover:border-primary/40'
          }`}
        >
          <div className="text-[11px] text-muted-foreground font-medium">All User Accounts</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5 flex items-center justify-between">
            {totalCount}
            <Users className="w-4 h-4 text-primary/70" />
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('ADMIN')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            roleFilter === 'ADMIN'
              ? 'bg-purple-50 border-purple-400 shadow-xs ring-1 ring-purple-300'
              : 'bg-card border-border hover:border-purple-300'
          }`}
        >
          <div className="text-[11px] text-muted-foreground font-medium">Administrators</div>
          <div className="text-xl font-bold text-purple-900 mt-0.5 flex items-center justify-between">
            {adminCount}
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('DOCTOR')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            roleFilter === 'DOCTOR'
              ? 'bg-emerald-50 border-emerald-400 shadow-xs ring-1 ring-emerald-300'
              : 'bg-card border-border hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] text-muted-foreground font-medium">Doctors / Clinicians</div>
          <div className="text-xl font-bold text-emerald-900 mt-0.5 flex items-center justify-between">
            {doctorCount}
            <Stethoscope className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div
          onClick={() => setRoleFilter('PATIENT')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            roleFilter === 'PATIENT'
              ? 'bg-blue-50 border-blue-400 shadow-xs ring-1 ring-blue-300'
              : 'bg-card border-border hover:border-blue-300'
          }`}
        >
          <div className="text-[11px] text-muted-foreground font-medium">Patients</div>
          <div className="text-xl font-bold text-blue-900 mt-0.5 flex items-center justify-between">
            {patientCount}
            <User className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users by name, email, specialization, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs bg-card"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-card text-xs font-medium"
        >
          <option value="">Filter: All Roles ({totalCount})</option>
          <option value="ADMIN">ADMIN ({adminCount})</option>
          <option value="DOCTOR">DOCTOR ({doctorCount})</option>
          <option value="PATIENT">PATIENT ({patientCount})</option>
        </select>
      </div>

      {alert.text && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-medium ${
            alert.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-destructive/10 border border-destructive/20 text-destructive'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{alert.text}</div>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner /></div>
      ) : users.length === 0 ? (
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No users found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? `No user accounts matching "${searchQuery}".` : 'No registered user accounts match the current filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => {
            const userRoles = Array.isArray(u.roles) ? u.roles : []
            const isEnabled = u.enabled !== false
            const isDoctor = userRoles.includes('DOCTOR')
            const isAdmin = userRoles.includes('ADMIN')
            const isPredefinedMainAdmin =
              u.isPredefinedAdmin === true ||
              u.username?.toLowerCase() === 'admin@hospital.com' ||
              u.id === 1
            const isUserAdmin = isAdmin && !isPredefinedMainAdmin

            return (
              <Card key={u.id} className="border-border/80 shadow-2xs flex flex-col justify-between">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {u.name || u.username || `User #${u.id}`}
                        </h3>
                        {isPredefinedMainAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Crown className="w-3 h-3 text-amber-600 fill-amber-500" /> Main Admin
                          </span>
                        )}
                        {isUserAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck className="w-3 h-3" /> User Admin
                          </span>
                        )}
                        {isDoctor && u.specialization && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Stethoscope className="w-3 h-3 text-emerald-600" /> {u.specialization}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {u.username} • User ID: <span className="font-mono font-semibold text-slate-700">#{u.id}</span>
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        isEnabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Roles list */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {userRoles.map((r) => (
                      <StatusBadge key={r} status={r} />
                    ))}
                  </div>

                  {/* Role Promotion & Demotion Actions */}
                  <div className="pt-2 border-t border-border/60 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                      Authority Actions
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {!isDoctor && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => handleOpenOnboardDoctor(u)}
                          disabled={roleMutation.isPending || onboardDoctorMutation.isPending}
                        >
                          <Stethoscope className="w-3 h-3 text-emerald-600" />
                          Make Doctor
                        </Button>
                      )}

                      {!isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 gap-1 text-purple-700 border-purple-200 hover:bg-purple-50"
                          onClick={() => handlePromoteToAdmin(u)}
                          disabled={roleMutation.isPending}
                        >
                          <ShieldCheck className="w-3 h-3 text-purple-600" />
                          Make Admin
                        </Button>
                      )}

                      {/* Admin demotion authority check */}
                      {isPredefinedMainAdmin ? (
                        <div className="col-span-2 text-center py-1 px-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold flex items-center justify-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                          Predefined Main Admin (Protected)
                        </div>
                      ) : isUserAdmin ? (
                        isCurrentMainAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[11px] h-7 gap-1 text-rose-700 border-rose-200 hover:bg-rose-50 col-span-2 font-medium"
                            onClick={() => handleDemoteToPatient(u)}
                            disabled={roleMutation.isPending}
                          >
                            <ArrowRightLeft className="w-3 h-3 text-rose-600" />
                            Revoke Admin Position
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="text-[11px] h-7 gap-1 text-slate-400 border-slate-200 bg-slate-50 col-span-2 cursor-not-allowed"
                            title="User Admins cannot remove or demote other administrators. Only the Predefined Main Admin has this authority."
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            Admin Protected (User Admins Cannot Remove)
                          </Button>
                        )
                      ) : (
                        isDoctor && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[11px] h-7 gap-1 text-blue-700 border-blue-200 hover:bg-blue-50 col-span-2"
                            onClick={() => handleDemoteToPatient(u)}
                            disabled={roleMutation.isPending}
                          >
                            <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                            Revert to Patient Only
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 gap-1 text-slate-600 hover:bg-muted"
                      onClick={() => handleOpenEditRoles(u)}
                    >
                      <Edit className="w-3 h-3" />
                      Custom Roles
                    </Button>

                    {isPredefinedMainAdmin ? (
                      <span className="text-[10px] text-muted-foreground italic px-2">Protected</span>
                    ) : isUserAdmin && !isCurrentMainAdmin ? (
                      <span className="text-[10px] text-muted-foreground italic px-2" title="User Admins cannot disable other administrators">
                        Admin Protected
                      </span>
                    ) : isEnabled ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-destructive hover:bg-destructive/10"
                        onClick={() => disableMutation.mutate(u.id)}
                        disabled={disableMutation.isPending}
                      >
                        <UserX className="w-3 h-3" />
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => enableMutation.mutate(u.id)}
                        disabled={enableMutation.isPending}
                      >
                        <UserCheck className="w-3 h-3" />
                        Enable
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Onboard as Doctor Modal */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                Onboard Doctor — User #{onboardData.userId}
              </CardTitle>
              <CardDescription className="text-xs">
                Grant Doctor role and register clinical credentials in medical registry
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Doctor Full Name</Label>
                  <Input
                    value={onboardData.name}
                    onChange={(e) => setOnboardData({ ...onboardData, name: e.target.value })}
                    placeholder="e.g. Dr. Jane Smith"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Specialization (Select Clinical Field)</Label>
                  <select
                    value={onboardData.specialization}
                    onChange={(e) => setOnboardData({ ...onboardData, specialization: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-card text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {CLINICAL_SPECIALIZATIONS.map((spec) => (
                      <option key={spec.value} value={spec.value}>
                        {spec.label}
                      </option>
                    ))}
                  </select>

                  {onboardData.specialization === 'CUSTOM' && (
                    <div className="pt-1.5 space-y-1">
                      <Label className="text-[11px] font-medium text-slate-600">Enter Custom Clinical Specialization</Label>
                      <Input
                        value={onboardData.customSpecialization}
                        onChange={(e) => setOnboardData({ ...onboardData, customSpecialization: e.target.value })}
                        placeholder="e.g. Pediatric Neurosurgeon, Sports Medicine"
                        className="text-xs h-8"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Official Doctor Email</Label>
                  <Input
                    value={onboardData.email}
                    onChange={(e) => setOnboardData({ ...onboardData, email: e.target.value })}
                    placeholder="doctor@hospital.com"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOnboardModalOpen(false)}
                  disabled={onboardDoctorMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={
                    onboardDoctorMutation.isPending ||
                    !onboardData.name ||
                    !(onboardData.specialization === 'CUSTOM' ? onboardData.customSpecialization?.trim() : onboardData.specialization)
                  }
                  onClick={() => {
                    const finalSpec =
                      onboardData.specialization === 'CUSTOM'
                        ? onboardData.customSpecialization?.trim() || 'General Medicine'
                        : onboardData.specialization
                    onboardDoctorMutation.mutate({
                      userId: Number(onboardData.userId),
                      name: onboardData.name,
                      specialization: finalSpec,
                      email: onboardData.email,
                    })
                  }}
                >
                  {onboardDoctorMutation.isPending ? 'Onboarding...' : 'Confirm & Grant Doctor Role'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Roles Modal */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Assign Roles — User #{selectedUser.id}
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedUser.username}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Toggle Permitted Roles:</p>
                {['PATIENT', 'DOCTOR', 'ADMIN'].map((r) => {
                  const isChecked = selectedRoles.includes(r)
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                        isChecked
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                          : 'border-border bg-card text-slate-700 hover:bg-muted/40'
                      }`}
                    >
                      <span className="font-semibold">{r}</span>
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-primary text-white border-primary' : 'border-input'
                        }`}
                      >
                        {isChecked ? '✓' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Clinical & Admin Rule:</strong> Selecting <strong>DOCTOR</strong> or <strong>ADMIN</strong> automatically removes the <strong>PATIENT</strong> role.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRoleModalOpen(false)}
                  disabled={roleMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={roleMutation.isPending}
                  onClick={() =>
                    roleMutation.mutate({
                      userId: selectedUser.id,
                      roles: selectedRoles,
                    })
                  }
                >
                  {roleMutation.isPending ? 'Saving...' : 'Save Roles'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create New User/Staff Modal */}
      {createUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Create Staff / User Account
              </CardTitle>
              <CardDescription className="text-xs">
                Directly establish a new Admin, Doctor, or Patient profile with custom role privileges.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newUserData.username || !newUserData.password || !newUserData.name) return
                  const finalSpec =
                    newUserData.role === 'DOCTOR'
                      ? (newUserData.specialization === 'CUSTOM'
                          ? newUserData.customSpecialization?.trim()
                          : newUserData.specialization) || 'General Medicine'
                      : newUserData.specialization
                  createUserMutation.mutate({
                    ...newUserData,
                    specialization: finalSpec,
                  })
                }}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                  <Input
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    placeholder="e.g. Dr. Alex Morgan"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Email Address (Login Username)</Label>
                  <Input
                    type="email"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    placeholder="staff@hospital.com"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-slate-700">Password</Label>
                    <button
                      type="button"
                      onClick={() => setNewUserData({ ...newUserData, password: 'Passw0rd123!' })}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Fill sample valid password
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="Passw0rd123!"
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Primary Role</Label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-card text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ADMIN">ADMIN (Full administrative access)</option>
                    <option value="DOCTOR">DOCTOR (Clinical physician portal)</option>
                    <option value="PATIENT">PATIENT (Standard medical record access)</option>
                  </select>
                </div>

                {newUserData.role === 'DOCTOR' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Clinical Specialization</Label>
                    <select
                      value={newUserData.specialization}
                      onChange={(e) => setNewUserData({ ...newUserData, specialization: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-input bg-card text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {CLINICAL_SPECIALIZATIONS.map((spec) => (
                        <option key={spec.value} value={spec.value}>
                          {spec.label}
                        </option>
                      ))}
                    </select>

                    {newUserData.specialization === 'CUSTOM' && (
                      <div className="pt-1.5 space-y-1">
                        <Label className="text-[11px] font-medium text-slate-600">Enter Custom Clinical Specialization</Label>
                        <Input
                          value={newUserData.customSpecialization || ''}
                          onChange={(e) => setNewUserData({ ...newUserData, customSpecialization: e.target.value })}
                          placeholder="e.g. Pediatric Orthopedics"
                          className="text-xs h-8"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateUserModalOpen(false)}
                    disabled={createUserMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createUserMutation.isPending}
                    className="font-semibold shadow-xs"
                  >
                    {createUserMutation.isPending ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
