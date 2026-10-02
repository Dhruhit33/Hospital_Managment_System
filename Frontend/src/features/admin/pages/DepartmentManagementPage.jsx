import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Users,
  Crown,
  UserMinus,
  UserPlus,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react'
import { departmentsApi } from '@/api/departments'
import { doctorApi } from '@/api/doctor'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function DepartmentManagementPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedDeptForAssign, setSelectedDeptForAssign] = useState(null)
  const [selectedDoctorIdToAssign, setSelectedDoctorIdToAssign] = useState('')
  const [assignAsHead, setAssignAsHead] = useState(false)
  const [doctorsListModalOpen, setDoctorsListModalOpen] = useState(false)
  const [activeDeptForDoctorsList, setActiveDeptForDoctorsList] = useState(null)
  const [changeHeadModalOpen, setChangeHeadModalOpen] = useState(false)
  const [selectedDeptForHead, setSelectedDeptForHead] = useState(null)
  const [selectedHeadDoctorId, setSelectedHeadDoctorId] = useState('')
  const [alert, setAlert] = useState({ type: '', text: '' })

  // Form State
  const [name, setName] = useState('')
  const [headDoctorId, setHeadDoctorId] = useState('')

  // Query Departments
  const { data: deptData, isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => departmentsApi.getDepartments({ page: 0, size: 50 }),
  })

  // Query Doctors for Head Doctor and Assignment dropdowns
  const { data: doctors = [] } = useQuery({
    queryKey: ['admin-all-doctors'],
    queryFn: async () => {
      try {
        const res = await doctorApi.getAllDoctors()
        return Array.isArray(res) ? res : []
      } catch (e) {
        return []
      }
    },
  })

  // Refresh active department in doctors list modal when data updates
  const departments = deptData?.content || []
  const currentActiveDept = activeDeptForDoctorsList
    ? departments.find((d) => d.id === activeDeptForDoctorsList.id) || activeDeptForDoctorsList
    : null

  // Save / Update Department Mutation
  const saveDeptMutation = useMutation({
    mutationFn: (payload) => {
      if (editingDept) {
        return departmentsApi.updateDepartment(editingDept.id, payload)
      }
      return departmentsApi.createDepartment(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] })
      queryClient.invalidateQueries({ queryKey: ['public-departments'] })
      queryClient.invalidateQueries({ queryKey: ['hospital-departments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      setModalOpen(false)
      setEditingDept(null)
      setName('')
      setHeadDoctorId('')
      setAlert({ type: 'success', text: 'Department and Head of Department successfully saved.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save department.',
      })
    },
  })

  // Delete Department Mutation
  const deleteDeptMutation = useMutation({
    mutationFn: (id) => departmentsApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] })
      queryClient.invalidateQueries({ queryKey: ['public-departments'] })
      queryClient.invalidateQueries({ queryKey: ['hospital-departments'] })
      setAlert({ type: 'success', text: 'Department deleted successfully.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete department. Remove doctors first.',
      })
    },
  })

  // Assign Doctor Mutation
  const assignDoctorMutation = useMutation({
    mutationFn: async ({ deptId, doctorId, makeHead }) => {
      const res = await departmentsApi.assignDoctor(deptId, doctorId)
      if (makeHead) {
        await departmentsApi.setDepartmentHead(deptId, doctorId)
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] })
      queryClient.invalidateQueries({ queryKey: ['public-departments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      setAssignModalOpen(false)
      setSelectedDoctorIdToAssign('')
      setAssignAsHead(false)
      setAlert({ type: 'success', text: 'Doctor assigned to department successfully.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to assign doctor to department.',
      })
    },
  })

  // Remove Doctor Mutation
  const removeDoctorMutation = useMutation({
    mutationFn: ({ deptId, doctorId }) => departmentsApi.removeDoctor(deptId, doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] })
      queryClient.invalidateQueries({ queryKey: ['public-departments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      setAlert({ type: 'success', text: 'Doctor removed from department.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove doctor from department.',
      })
    },
  })

  // Set Head Doctor Mutation
  const setHeadDoctorMutation = useMutation({
    mutationFn: ({ deptId, doctorId }) => departmentsApi.setDepartmentHead(deptId, doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] })
      queryClient.invalidateQueries({ queryKey: ['public-departments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
      setChangeHeadModalOpen(false)
      setAlert({ type: 'success', text: 'Department Head updated successfully.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to set head of department.',
      })
    },
  })

  const handleOpenCreate = () => {
    setEditingDept(null)
    setName('')
    setHeadDoctorId('')
    setModalOpen(true)
    setAlert({ type: '', text: '' })
  }

  const handleOpenEdit = (dept) => {
    setEditingDept(dept)
    setName(dept.name)
    setHeadDoctorId(dept.headDoctorId ? String(dept.headDoctorId) : '')
    setModalOpen(true)
    setAlert({ type: '', text: '' })
  }

  const handleOpenDoctorsList = (dept) => {
    setActiveDeptForDoctorsList(dept)
    setDoctorsListModalOpen(true)
    setAlert({ type: '', text: '' })
  }

  const handleOpenChangeHead = (dept) => {
    setSelectedDeptForHead(dept)
    setSelectedHeadDoctorId(dept.headDoctorId ? String(dept.headDoctorId) : '')
    setChangeHeadModalOpen(true)
    setAlert({ type: '', text: '' })
  }

  const handleOpenAssignDoctor = (dept) => {
    setSelectedDeptForAssign(dept)
    setSelectedDoctorIdToAssign('')
    setAssignAsHead(false)
    setAssignModalOpen(true)
    setAlert({ type: '', text: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setAlert({ type: 'error', text: 'Department name is required.' })
      return
    }

    saveDeptMutation.mutate({
      name: name.trim(),
      headDoctorId: headDoctorId ? Number(headDoctorId) : null,
    })
  }

  const handleSaveHeadDoctor = (e) => {
    e.preventDefault()
    if (!selectedDeptForHead || !selectedHeadDoctorId) {
      setAlert({ type: 'error', text: 'Please select a physician to designate as Head.' })
      return
    }

    setHeadDoctorMutation.mutate({
      deptId: selectedDeptForHead.id,
      doctorId: Number(selectedHeadDoctorId),
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Department Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Organize clinical specialties, designate Heads of Department, and manage departmental doctors.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate} className="gap-2 shadow-xs">
          <Plus className="w-4 h-4" />
          Create Department
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

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : departments.length === 0 ? (
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="py-16 text-center space-y-2">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No departments configured</h3>
            <p className="text-xs text-muted-foreground">
              Click "Create Department" above to establish clinical divisions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const headDoc =
              dept.headDoctorName
                ? { name: dept.headDoctorName, specialization: dept.headDoctorSpecialization }
                : doctors.find((d) => d.id === dept.headDoctorId)

            const deptDoctors = Array.isArray(dept.doctors) ? dept.doctors : []
            const doctorCount = dept.doctorCount !== undefined ? dept.doctorCount : deptDoctors.length

            return (
              <Card key={dept.id} className="border-border/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                        <p className="text-[11px] text-muted-foreground">ID #{dept.id}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      {doctorCount} {doctorCount === 1 ? 'Doctor' : 'Doctors'}
                    </span>
                  </div>

                  {/* Department Head Section */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                        {headDoc ? <Crown className="w-3 h-3 text-amber-500 fill-amber-400" /> : null}
                        Department Head
                      </span>
                      <strong className={`block mt-0.5 ${headDoc ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}`}>
                        {headDoc ? headDoc.name : 'Not Assigned'}
                      </strong>
                      {headDoc?.specialization && (
                        <span className="text-[10px] text-muted-foreground block">{headDoc.specialization}</span>
                      )}
                    </div>

                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleOpenChangeHead(dept)}
                      className="text-[11px] text-primary hover:bg-primary/10 h-7"
                    >
                      {headDoc ? 'Change' : '+ Set Head'}
                    </Button>
                  </div>

                  {/* Actions & Doctors List Trigger */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDoctorsList(dept)}
                      className="text-xs h-8 gap-1.5 text-slate-700 hover:text-primary hover:border-primary/40 font-semibold"
                    >
                      <Users className="w-3.5 h-3.5 text-primary" />
                      View Doctors ({doctorCount})
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenAssignDoctor(dept)}
                        className="text-xs h-8 text-primary hover:bg-primary/10 font-medium"
                      >
                        + Assign
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(dept)}
                        className="text-xs h-8 p-1.5 text-slate-600"
                        title="Edit Department"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteDeptMutation.mutate(dept.id)}
                        disabled={deleteDeptMutation.isPending}
                        className="text-xs h-8 p-1.5 text-destructive hover:bg-destructive/10"
                        title="Delete Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 1. View Doctors of Department Modal ("show list with head") */}
      {doctorsListModalOpen && currentActiveDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl shadow-xl border-border my-6">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    {currentActiveDept.name} — Doctors & Head
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Review assigned clinical specialists, promote physicians to Department Head, or assign staff.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpenAssignDoctor(currentActiveDept)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Assign Doctor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Highlight Department Head */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    Head of Department
                  </span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => handleOpenChangeHead(currentActiveDept)}
                    className="text-xs h-7 border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    Change Head Doctor
                  </Button>
                </div>

                {currentActiveDept.headDoctorId ? (
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {currentActiveDept.headDoctorName ||
                          doctors.find((d) => d.id === currentActiveDept.headDoctorId)?.name ||
                          `Doctor #${currentActiveDept.headDoctorId}`}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {currentActiveDept.headDoctorSpecialization ||
                          doctors.find((d) => d.id === currentActiveDept.headDoctorId)?.specialization ||
                          'Clinical Specialist'}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      Doctor ID: #{currentActiveDept.headDoctorId}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-800 italic pt-1">
                    No Department Head is currently designated. Click "Set as Head" on any doctor below to assign.
                  </p>
                )}
              </div>

              {/* Doctors List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Assigned Physicians ({currentActiveDept.doctors?.length || 0})
                  </h4>
                </div>

                {!currentActiveDept.doctors || currentActiveDept.doctors.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-border/80 space-y-2">
                    <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-medium text-slate-700">No doctors assigned to this department yet.</p>
                    <p className="text-[11px] text-muted-foreground">
                      Use the "+ Assign Doctor" button above to add physicians to {currentActiveDept.name}.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60 border border-border/80 rounded-xl overflow-hidden bg-white">
                    {currentActiveDept.doctors.map((doc) => {
                      const isHead = currentActiveDept.headDoctorId === doc.id
                      return (
                        <div
                          key={doc.id}
                          className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors ${
                            isHead ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                                isHead
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {isHead ? (
                                <Crown className="w-4 h-4 fill-amber-400" />
                              ) : (
                                <Stethoscope className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h5 className="text-xs font-bold text-slate-900 truncate">{doc.name}</h5>
                                {isHead && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Head
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                <span>{doc.specialization || 'Specialist'}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-600">ID #{doc.id}</span>
                                {doc.email && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{doc.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isHead && (
                              <Button
                                size="xs"
                                variant="outline"
                                className="text-amber-800 border-amber-300 hover:bg-amber-50 h-7 text-[11px] gap-1"
                                onClick={() =>
                                  setHeadDoctorMutation.mutate({
                                    deptId: currentActiveDept.id,
                                    doctorId: doc.id,
                                  })
                                }
                                disabled={setHeadDoctorMutation.isPending}
                              >
                                <Crown className="w-3 h-3 text-amber-500" />
                                Set as Head
                              </Button>
                            )}

                            <Button
                              size="xs"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 h-7 text-[11px] gap-1"
                              onClick={() =>
                                removeDoctorMutation.mutate({
                                  deptId: currentActiveDept.id,
                                  doctorId: doc.id,
                                })
                              }
                              disabled={removeDoctorMutation.isPending}
                            >
                              <UserMinus className="w-3 h-3" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-border/60">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDoctorsListModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Change / Set Head of Department Modal */}
      {changeHeadModalOpen && selectedDeptForHead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                Set Head of {selectedDeptForHead.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Designate the supervising Head Physician for this clinical department.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveHeadDoctor} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Select Head Doctor</Label>
                  <select
                    value={selectedHeadDoctorId}
                    onChange={(e) => setSelectedHeadDoctorId(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    required
                  >
                    <option value="">-- Choose Physician as Department Head --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization}) — ID #{d.id}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Selected doctor will automatically be associated with this department if not already assigned.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setChangeHeadModalOpen(false)}
                    disabled={setHeadDoctorMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={setHeadDoctorMutation.isPending || !selectedHeadDoctorId}
                  >
                    {setHeadDoctorMutation.isPending ? 'Saving...' : 'Confirm Head Doctor'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Create / Edit Department Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-slate-900">
                {editingDept ? `Edit Department #${editingDept.id}` : 'Create Department'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="deptName" className="text-xs font-semibold text-slate-700">
                    Department Name *
                  </Label>
                  <Input
                    id="deptName"
                    placeholder="e.g. Cardiology, Neurology, Orthopedics"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="headDoctorId" className="text-xs font-semibold text-slate-700">
                    Head Physician (optional)
                  </Label>
                  <select
                    id="headDoctorId"
                    value={headDoctorId}
                    onChange={(e) => setHeadDoctorId(e.target.value)}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <option value="">None / Unassigned</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization}) — ID #{d.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalOpen(false)}
                    disabled={saveDeptMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={saveDeptMutation.isPending}>
                    {saveDeptMutation.isPending ? 'Saving...' : 'Save Department'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Assign Doctor Modal */}
      {assignModalOpen && selectedDeptForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Assign Doctor to {selectedDeptForAssign.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Select Doctor *</Label>
                <select
                  value={selectedDoctorIdToAssign}
                  onChange={(e) => setSelectedDoctorIdToAssign(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  required
                >
                  <option value="">-- Choose Doctor to Assign --</option>
                  {doctors.map((d) => {
                    const isAlreadyInDept =
                      Array.isArray(selectedDeptForAssign.doctors) &&
                      selectedDeptForAssign.doctors.some((doc) => doc.id === d.id)

                    return (
                      <option key={d.id} value={d.id} disabled={isAlreadyInDept}>
                        {d.name} ({d.specialization}) — ID #{d.id} {isAlreadyInDept ? '✓ (Already in Department)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Option to also designate as Head */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="assignAsHead"
                  checked={assignAsHead}
                  onChange={(e) => setAssignAsHead(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="assignAsHead" className="text-xs text-slate-700 cursor-pointer font-medium flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  Also designate as Head of Department
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignModalOpen(false)}
                  disabled={assignDoctorMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={assignDoctorMutation.isPending || !selectedDoctorIdToAssign}
                  onClick={() =>
                    assignDoctorMutation.mutate({
                      deptId: selectedDeptForAssign.id,
                      doctorId: Number(selectedDoctorIdToAssign),
                      makeHead: assignAsHead,
                    })
                  }
                >
                  {assignDoctorMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
