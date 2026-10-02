import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Stethoscope,
  UserPlus,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Building2,
  Sparkles,
  Check,
  Lock,
  Layers,
} from 'lucide-react'
import { doctorApi } from '@/api/doctor'
import { adminApi } from '@/api/admin'
import { departmentsApi } from '@/api/departments'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

// Standard Clinical Specializations with departmental affinity
const CLINICAL_SPECIALIZATIONS = [
  { label: 'Cardiology (Heart & Cardiovascular)', value: 'Cardiology', departmentMatch: 'cardio' },
  { label: 'Neurology (Brain & Nervous System)', value: 'Neurology', departmentMatch: 'neuro' },
  { label: 'Pediatrics (Children & Infants)', value: 'Pediatrics', departmentMatch: 'pediatric' },
  { label: 'Orthopedics (Bones & Joints)', value: 'Orthopedics', departmentMatch: 'ortho' },
  { label: 'General Medicine (Internal Medicine)', value: 'General Medicine', departmentMatch: 'general' },
  { label: 'Dermatology (Skin & Aesthetics)', value: 'Dermatology', departmentMatch: 'derma' },
  { label: 'Radiology & Medical Imaging', value: 'Radiology', departmentMatch: 'radio' },
  { label: 'General Surgery', value: 'Surgery', departmentMatch: 'surg' },
  { label: 'Emergency Medicine (Trauma & ER)', value: 'Emergency Medicine', departmentMatch: 'emerg' },
  { label: 'Oncology (Cancer Specialist)', value: 'Oncology', departmentMatch: 'onco' },
  { label: 'Gynecology & Obstetrics (OB-GYN)', value: 'Gynecology', departmentMatch: 'gyne' },
  { label: 'Psychiatry & Mental Health', value: 'Psychiatry', departmentMatch: 'psych' },
  { label: 'Ophthalmology (Eye Care)', value: 'Ophthalmology', departmentMatch: 'ophthalm' },
  { label: 'ENT / Otorhinolaryngology', value: 'ENT', departmentMatch: 'ent' },
  { label: 'Gastroenterology (Digestive Health)', value: 'Gastroenterology', departmentMatch: 'gastro' },
  { label: 'Nephrology (Kidney Care)', value: 'Nephrology', departmentMatch: 'nephro' },
  { label: 'Pulmonology (Lungs & Respiratory)', value: 'Pulmonology', departmentMatch: 'pulmo' },
  { label: 'Urology (Urinary Tract & Surgery)', value: 'Urology', departmentMatch: 'uro' },
  { label: 'Anesthesiology & Critical Care', value: 'Anesthesiology', departmentMatch: 'anesthe' },
  { label: 'Pathology & Diagnostic Laboratory', value: 'Pathology', departmentMatch: 'patho' },
  { label: 'Other / Custom Specialization...', value: 'CUSTOM', departmentMatch: '' },
]

export function DoctorManagementPage() {
  const queryClient = useQueryClient()
  const [onboardModalOpen, setOnboardModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [alert, setAlert] = useState({ type: '', text: '' })

  // Form State
  const [selectedUserKey, setSelectedUserKey] = useState('')
  const [userId, setUserId] = useState('')
  const [isManualUserId, setIsManualUserId] = useState(false)
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [customSpecialization, setCustomSpecialization] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [email, setEmail] = useState('')

  // Query doctors
  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      try {
        const res = await doctorApi.getAllDoctors()
        return Array.isArray(res) ? res : []
      } catch (e) {
        return []
      }
    },
  })

  // Query registered users for auto-setting user ID, name, email
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: () => adminApi.getUsers({ page: 0, size: 100 }),
    enabled: onboardModalOpen,
  })

  const registeredUsers = Array.isArray(usersData?.content)
    ? usersData.content
    : Array.isArray(usersData)
    ? usersData
    : []

  // Query departments for department selection
  const { data: deptsData, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['hospital-departments'],
    queryFn: () => departmentsApi.getDepartments({ page: 0, size: 100 }),
  })

  const departmentsList = Array.isArray(deptsData?.content)
    ? deptsData.content
    : Array.isArray(deptsData)
    ? deptsData
    : []

  // Existing doctor identifiers to detect already onboarded accounts
  const existingDoctorUserIds = new Set(doctors.map((d) => Number(d.id)))
  const existingDoctorEmails = new Set(doctors.map((d) => d.email?.toLowerCase()))

  // Auto-set user details when selected from dropdown
  const handleUserSelect = (selectedId) => {
    setSelectedUserKey(selectedId)
    if (!selectedId) {
      setUserId('')
      setName('')
      setEmail('')
      return
    }

    const foundUser = registeredUsers.find((u) => String(u.id) === String(selectedId))
    if (foundUser) {
      setUserId(String(foundUser.id))

      // Format doctor name with 'Dr.' prefix automatically
      let formattedName = (foundUser.name || '').trim()
      if (formattedName) {
        if (!formattedName.toLowerCase().startsWith('dr')) {
          formattedName = `Dr. ${formattedName}`
        }
      } else {
        const usernamePrefix = (foundUser.username || '').split('@')[0]
        const capitalized = usernamePrefix.charAt(0).toUpperCase() + usernamePrefix.slice(1)
        formattedName = `Dr. ${capitalized}`
      }
      setName(formattedName)

      // Auto-set email from user's registered account username
      setEmail(foundUser.username || '')
    }
  }

  // Handle specialization change & auto-sync department
  const handleSpecializationChange = (val) => {
    setSpecialization(val)
    if (val !== 'CUSTOM') {
      setCustomSpecialization('')
      // Auto-suggest department matching specialization if not already chosen
      const specObj = CLINICAL_SPECIALIZATIONS.find((s) => s.value === val)
      if (specObj?.departmentMatch && departmentsList.length > 0) {
        const matched = departmentsList.find((d) =>
          d.name?.toLowerCase().includes(specObj.departmentMatch)
        )
        if (matched) {
          setDepartmentId(String(matched.id))
        }
      }
    }
  }

  // Reset form
  const resetForm = () => {
    setSelectedUserKey('')
    setUserId('')
    setIsManualUserId(false)
    setName('')
    setSpecialization('')
    setCustomSpecialization('')
    setDepartmentId('')
    setEmail('')
  }

  // Onboard mutation
  const onboardMutation = useMutation({
    mutationFn: async (payload) => {
      // 1. Onboard doctor with user ID, name, specialization, email, departmentId
      const newDoc = await adminApi.onboardDoctor(payload)
      // 2. Also ensure department association if departmentId is selected
      if (payload.departmentId && newDoc?.id) {
        try {
          await departmentsApi.assignDoctor(payload.departmentId, newDoc.id)
        } catch (e) {
          // May already be linked by backend service, safely continue
        }
      }
      return newDoc
    },
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['public-doctors'] })
      queryClient.invalidateQueries({ queryKey: ['hospital-departments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] })
      setOnboardModalOpen(false)
      resetForm()
      setAlert({
        type: 'success',
        text: `Doctor ${newDoc.name || 'Specialist'} successfully onboarded and stored in doctor dataset!`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to onboard doctor. Ensure User ID is valid and not already a doctor.',
      })
    },
  })

  const handleOnboardSubmit = (e) => {
    e.preventDefault()
    const finalSpec = specialization === 'CUSTOM' ? customSpecialization.trim() : specialization.trim()

    if (!userId || !name.trim() || !finalSpec || !email.trim()) {
      setAlert({
        type: 'error',
        text: 'Registered User ID, Doctor Name, Specialization, and Official Email are required.',
      })
      return
    }

    onboardMutation.mutate({
      userId: Number(userId),
      name: name.trim(),
      specialization: finalSpec,
      email: email.trim(),
      departmentId: departmentId ? Number(departmentId) : undefined,
    })
  }

  const filteredDoctors = doctors.filter((d) => {
    const term = searchTerm.toLowerCase()
    return (
      d.name?.toLowerCase().includes(term) ||
      d.specialization?.toLowerCase().includes(term) ||
      d.departmentName?.toLowerCase().includes(term) ||
      d.email?.toLowerCase().includes(term) ||
      String(d.id).includes(term)
    )
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Physician Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review active hospital specialists, inspect clinical roles, and onboard qualified doctors.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setOnboardModalOpen(true)
            setAlert({ type: '', text: '' })
          }}
          className="gap-2 shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Onboard New Doctor
        </Button>
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

      {/* Filter bar */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search by physician name, specialization, department, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Doctor Cards Grid */}
      {isLoadingDoctors ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="py-16 text-center space-y-2">
            <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No doctors found</h3>
            <p className="text-xs text-muted-foreground">
              Click "Onboard New Doctor" above to register your first clinical staff member.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <Card key={doc.id} className="border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{doc.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary">
                        {doc.specialization || 'General Specialist'}
                      </span>
                      {doc.departmentName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{doc.departmentName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>
                      Doctor & User ID: <strong className="font-mono text-slate-700">#{doc.id}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[10px]">
                      <Check className="w-3 h-3" /> Active Staff
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Onboard Doctor Modal */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-xl border-border my-6">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Onboard Specialist Doctor
              </CardTitle>
              <CardDescription className="text-xs">
                Creates doctor record for an existing registered user account and stores in doctor dataset
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleOnboardSubmit} className="space-y-4">
                {/* 1. Registered User Selection (Auto-sets User ID, Name, Email) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="userSelect" className="text-xs font-semibold text-slate-700">
                      Select Registered User Account *
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsManualUserId(!isManualUserId)}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      {isManualUserId ? '← Select from user list' : 'Manual ID entry →'}
                    </button>
                  </div>

                  {!isManualUserId ? (
                    <>
                      <select
                        id="userSelect"
                        value={selectedUserKey}
                        onChange={(e) => handleUserSelect(e.target.value)}
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        disabled={isLoadingUsers}
                      >
                        <option value="">
                          {isLoadingUsers ? 'Loading registered users...' : '-- Choose Registered Account (Auto-sets ID) --'}
                        </option>
                        {registeredUsers.map((user) => {
                          const isAlreadyDoc =
                            existingDoctorUserIds.has(Number(user.id)) ||
                            existingDoctorEmails.has(user.username?.toLowerCase()) ||
                            (Array.isArray(user.roles) && user.roles.includes('DOCTOR'))

                          return (
                            <option
                              key={user.id}
                              value={user.id}
                              disabled={isAlreadyDoc}
                              className={isAlreadyDoc ? 'text-slate-400' : 'text-slate-900 font-medium'}
                            >
                              {user.name || user.username} ({user.username}) — User ID #{user.id}
                              {isAlreadyDoc ? ' [Already Doctor]' : ' [Eligible]'}
                            </option>
                          )
                        })}
                      </select>
                      <p className="text-[10px] text-muted-foreground">
                        Selecting a registered user automatically populates User ID, Doctor Name, and Official Email.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <Input
                        id="userId"
                        type="number"
                        placeholder="e.g. 2, 5, 20"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="text-xs font-mono"
                        required
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Manual ID entry mode. Ensure the user exists in CarePoint.
                      </p>
                    </div>
                  )}

                  {/* Auto-set User ID Display Pill */}
                  {userId && !isManualUserId && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Account selected:</span>
                        <strong className="text-emerald-950">{email}</strong>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-900 font-mono text-[11px] font-bold">
                        User ID: #{userId} (Auto-Set)
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Full Doctor Name (Auto-populated, editable) */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                    Full Doctor Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Dr. Alan Grant"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Clinical display name (pre-formatted with Dr. title).
                  </p>
                </div>

                {/* 3. Specialization (Select Dropdown) */}
                <div className="space-y-1.5">
                  <Label htmlFor="specialization" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Clinical Specialization * (Select Type)</span>
                    <span className="text-[10px] text-primary font-normal">Dropdown Selector</span>
                  </Label>
                  <select
                    id="specialization"
                    value={specialization}
                    onChange={(e) => handleSpecializationChange(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    required
                  >
                    <option value="">-- Select Doctor Specialization --</option>
                    {CLINICAL_SPECIALIZATIONS.map((spec) => (
                      <option key={spec.value} value={spec.value}>
                        {spec.label}
                      </option>
                    ))}
                  </select>

                  {specialization === 'CUSTOM' && (
                    <Input
                      placeholder="Type custom clinical specialization (e.g. Pediatric Cardiology)..."
                      value={customSpecialization}
                      onChange={(e) => setCustomSpecialization(e.target.value)}
                      className="text-xs mt-1.5"
                      required
                    />
                  )}
                </div>

                {/* 4. Hospital Department (Department Type Show / Select) */}
                <div className="space-y-1.5">
                  <Label htmlFor="departmentId" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Hospital Department * (Department Type)</span>
                    <span className="text-[10px] text-emerald-700 font-normal">Department Link</span>
                  </Label>
                  <select
                    id="departmentId"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    disabled={isLoadingDepts}
                  >
                    <option value="">
                      {isLoadingDepts ? 'Loading hospital departments...' : '-- Select Hospital Department --'}
                    </option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} (Dept #{dept.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Auto-suggested from specialization or choose a specific medical wing.
                  </p>
                </div>

                {/* 5. Official Email (Auto-populated from account) */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    Official Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Used for doctor notifications, patient consults, and schedule confirmations.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOnboardModalOpen(false)
                      resetForm()
                    }}
                    disabled={onboardMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={onboardMutation.isPending}>
                    {onboardMutation.isPending ? 'Onboarding Doctor...' : 'Onboard Doctor'}
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
