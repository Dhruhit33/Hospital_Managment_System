import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Search,
  FileText,
  Calendar,
  Pill,
  Clock,
  HeartPulse,
  Phone,
  Mail,
  Droplet,
  ChevronRight,
  UserCheck,
  Stethoscope,
  Activity,
  ArrowLeft,
  Download,
  Trash2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  UploadCloud,
  Eye,
} from 'lucide-react'
import { doctorApi } from '@/api/doctor'
import { recordsApi } from '@/api/records'
import { downloadReportFile } from '@/lib/reportDownload'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useAuthStore } from '@/store/authStore'

export function DoctorPatientsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [searchTerm, setSearchTerm] = useState('')
  const [activePatient, setActivePatient] = useState(null)
  const [alert, setAlert] = useState({ type: '', text: '' })
  const [previewDoc, setPreviewDoc] = useState(null)

  // Modal state for doctor filing new medical record / lab report for active patient
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    diagnosis: '',
    recordType: 'Diagnostic Lab Report',
    consultationDate: new Date().toISOString().split('T')[0],
    followUpDate: '',
    notes: '',
    attachmentName: '',
    attachmentSize: '',
    attachmentType: '',
    attachmentData: '',
  })
  const [uploadPrescriptions, setUploadPrescriptions] = useState([])

  // 1. Fetch doctor's patients list
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['doctor-patients'],
    queryFn: async () => {
      try {
        const res = await doctorApi.getDoctorPatients()
        return Array.isArray(res) ? res : []
      } catch (e) {
        return []
      }
    },
  })

  // 2. Fetch records for the selected patient (merge server + appointments + multi-key synced records)
  const { data: recordsData, isLoading: loadingRecords, isFetching: fetchingRecords } = useQuery({
    queryKey: ['doctor-patient-records', activePatient?.id, activePatient?.email],
    queryFn: async () => {
      let serverRecords = []
      try {
        const res = await recordsApi.getDoctorPatientRecords(Number(activePatient.id), { page: 0, size: 50 })
        serverRecords = res?.content || (Array.isArray(res) ? res : [])
      } catch (e) {
        console.warn('Backend records fetch error:', e?.message)
      }

      // Check appointment-specific records for this patient
      try {
        const appointmentsRes = await doctorApi.getDoctorAppointments()
        const doctorAppointments = Array.isArray(appointmentsRes) ? appointmentsRes : []
        const patientAppointments = doctorAppointments.filter(
          (apt) =>
            Number(apt.patient?.id) === Number(activePatient.id) ||
            Number(apt.patientId) === Number(activePatient.id) ||
            (activePatient.email &&
              apt.patient?.email?.toLowerCase() === activePatient.email?.toLowerCase())
        )
        for (const apt of patientAppointments) {
          try {
            const aptRec = await recordsApi.getRecordByAppointmentId(apt.id)
            if (aptRec && !serverRecords.some((r) => r.id === aptRec.id || r.appointmentId === apt.id)) {
              serverRecords.push(aptRec)
            }
          } catch (_) {}
        }
      } catch (e) {
        console.warn('Could not fetch appointment records:', e?.message)
      }

      // Collect all records from localStorage matching this patient
      const localRecords = []
      const seenIds = new Set(serverRecords.map((r) => r.id))

      try {
        const patientIdStr = String(activePatient.id)
        const patientEmailLower = (activePatient.email || '').toLowerCase()
        const patientNameLower = (activePatient.name || '').toLowerCase()

        const addCandidate = (item) => {
          if (!item || !item.id || seenIds.has(item.id)) return

          const itemPatientId = item.patientId != null ? String(item.patientId) : ''
          const itemEmail = (item.patientEmail || '').toLowerCase()
          const itemPatientName = (item.patientName || '').toLowerCase()

          // Direct match criteria:
          // 1. Same ID
          // 2. Same Email
          // 3. Same Name
          const isDirectMatch =
            itemPatientId === patientIdStr ||
            (patientEmailLower && itemEmail === patientEmailLower) ||
            (patientNameLower && itemPatientName === patientNameLower) ||
            (patientEmailLower && itemPatientId === patientEmailLower)

          // Fallback match: if record is stored under default/unassigned and does not belong to another email
          const isGeneralMatch =
            (!itemPatientId || itemPatientId === 'default' || itemPatientId === '1') &&
            (!itemEmail || itemEmail === patientEmailLower)

          if (isDirectMatch || isGeneralMatch) {
            seenIds.add(item.id)
            localRecords.push({
              ...item,
              patientName: item.patientName || activePatient.name,
              patientEmail: item.patientEmail || activePatient.email,
              patientId: activePatient.id,
            })
          }
        }

        // Direct keys
        const directKeys = [
          `carepoint_records_${activePatient.id}`,
          `carepoint_records_${activePatient.email}`,
          'carepoint_records_default',
          'carepoint_all_records',
        ]
        directKeys.forEach((key) => {
          try {
            const items = JSON.parse(localStorage.getItem(key) || '[]')
            if (Array.isArray(items)) items.forEach(addCandidate)
          } catch (_) {}
        })

        // Scan all carepoint_records_*
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && (k.startsWith('carepoint_records_') || k === 'carepoint_all_records')) {
            try {
              const items = JSON.parse(localStorage.getItem(k) || '[]')
              if (Array.isArray(items)) items.forEach(addCandidate)
            } catch (_) {}
          }
        }
      } catch (e) {
        console.warn('Error reading localStorage for patient records:', e)
      }

      // Return combined, sorted by creation date descending
      const combined = [...localRecords, ...serverRecords].sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime()
        const db = new Date(b.createdAt || 0).getTime()
        return db - da
      })

      return { content: combined }
    },
    enabled: !!activePatient?.id,
  })

  const records = recordsData?.content || []

  // Delete Record Mutation
  const deleteMutation = useMutation({
    mutationFn: (recordId) => recordsApi.deleteDoctorRecord(recordId).catch(() => {}),
    onSuccess: (_, recordId) => {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && (k.startsWith('carepoint_records_') || k === 'carepoint_all_records')) {
            try {
              const list = JSON.parse(localStorage.getItem(k) || '[]')
              if (Array.isArray(list)) {
                const filtered = list.filter((r) => r.id !== recordId)
                localStorage.setItem(k, JSON.stringify(filtered))
              }
            } catch (_) {}
          }
        }
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ['doctor-patient-records'] })
      queryClient.invalidateQueries({ queryKey: ['patient-records'] })
      setAlert({ type: 'success', text: 'Medical record / report deleted successfully.' })
    },
    onError: () => {
      setAlert({ type: 'error', text: 'Failed to delete record.' })
    },
  })

  // Create / Upload Medical Record Mutation
  const uploadRecordMutation = useMutation({
    mutationFn: async (payload) => {
      let savedServer = null
      try {
        savedServer = await recordsApi.createPatientRecordForDoctor(activePatient.id, {
          diagnosis: payload.diagnosis,
          notes: payload.notes,
          followUpDate: payload.followUpDate,
          attachmentName: payload.attachmentName,
          attachmentSize: payload.attachmentSize,
          attachmentType: payload.attachmentType,
          attachmentData: payload.attachmentData,
          prescriptions: payload.prescriptions,
        })
      } catch (e) {
        console.warn('Backend patient record creation error, attempting appointment fallback:', e?.message)
        try {
          let appointmentId = activePatient?.latestAppointmentId || activePatient?.appointmentId || null
          if (!appointmentId) {
            const appointmentsRes = await doctorApi.getDoctorAppointments()
            const doctorAppointments = Array.isArray(appointmentsRes) ? appointmentsRes : []
            const matchApt = doctorAppointments.find(
              (apt) =>
                Number(apt.patient?.id) === Number(activePatient.id) ||
                Number(apt.patientId) === Number(activePatient.id) ||
                (activePatient.email &&
                  apt.patient?.email?.toLowerCase() === activePatient.email?.toLowerCase())
            )
            if (matchApt) appointmentId = matchApt.id
          }

          if (appointmentId) {
            savedServer = await recordsApi.createAppointmentRecord(appointmentId, {
              diagnosis: payload.diagnosis,
              notes: payload.notes,
              followUpDate: payload.followUpDate,
              attachmentName: payload.attachmentName,
              attachmentSize: payload.attachmentSize,
              attachmentType: payload.attachmentType,
              attachmentData: payload.attachmentData,
              prescriptions: payload.prescriptions,
            })
          }
        } catch (_) {}
      }

      const mergedPayload = savedServer
        ? {
            ...payload,
            id: savedServer.id || payload.id,
            appointmentId: savedServer.appointmentId || payload.appointmentId,
          }
        : payload

      return recordsApi.savePatientRecord(mergedPayload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-patient-records'] })
      queryClient.invalidateQueries({ queryKey: ['patient-records'] })
      setUploadModalOpen(false)
      setAlert({
        type: 'success',
        text: `Clinical medical record and diagnostic report for ${activePatient.name} filed successfully.`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err?.message || 'Failed to file clinical record.',
      })
    },
  })

  const handleOpenUploadModal = () => {
    setUploadFormData({
      diagnosis: '',
      recordType: 'Diagnostic Lab Report',
      consultationDate: new Date().toISOString().split('T')[0],
      followUpDate: '',
      notes: '',
      attachmentName: '',
      attachmentSize: '',
      attachmentType: '',
      attachmentData: '',
    })
    setUploadPrescriptions([])
    setUploadModalOpen(true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2)
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadFormData((prev) => ({
          ...prev,
          attachmentName: file.name,
          attachmentSize: `${sizeMb} MB`,
          attachmentType: file.type || 'application/pdf',
          attachmentData: event.target.result,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddPrescription = () => {
    setUploadPrescriptions((prev) => [
      ...prev,
      { medicineName: '', dosage: '', frequency: 'Once daily', durationDays: 5, instructions: 'After meals' },
    ])
  }

  const handleRemovePrescription = (idx) => {
    setUploadPrescriptions((prev) => prev.filter((_, i) => i !== idx))
  }

  const handlePrescriptionChange = (idx, field, value) => {
    setUploadPrescriptions((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  const handleSubmitUpload = (e) => {
    e.preventDefault()
    if (!uploadFormData.diagnosis.trim()) {
      setAlert({ type: 'error', text: 'Please specify a diagnosis or report title.' })
      return
    }

    const cleanedPrescriptions = uploadPrescriptions.filter(
      (p) => p.medicineName && p.medicineName.trim().length > 0
    )

    uploadRecordMutation.mutate({
      diagnosis: uploadFormData.diagnosis.trim(),
      doctorId: user?.id,
      doctorName: user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : 'Attending Physician',
      doctorSpecialization: user?.specialization || 'Clinical Medicine',
      recordType: uploadFormData.recordType,
      followUpDate: uploadFormData.followUpDate || undefined,
      notes: uploadFormData.notes.trim() || undefined,
      attachmentName: uploadFormData.attachmentName || undefined,
      attachmentSize: uploadFormData.attachmentSize || undefined,
      attachmentType: uploadFormData.attachmentType || undefined,
      attachmentData: uploadFormData.attachmentData || undefined,
      prescriptions: cleanedPrescriptions,
      patientId: activePatient.id,
      patientEmail: activePatient.email,
      patientName: activePatient.name,
      createdAt: new Date(uploadFormData.consultationDate).toISOString(),
    })
  }

  const handleDownload = (rec) => {
    downloadReportFile({
      attachmentData: rec.attachmentData,
      attachmentName: rec.attachmentName,
      diagnosis: rec.diagnosis || 'Clinical Medical Record',
      notes: rec.notes || '',
      prescriptions: rec.prescriptions || [],
      patientName: activePatient?.name || rec.patientName || 'Patient',
      doctorName: rec.doctorName || 'Attending Physician',
      doctorSpecialization: rec.doctorSpecialization || 'Clinical Medicine',
      date: rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      id: rec.id,
      appointmentId: rec.appointmentId,
    })
    setAlert({ type: 'success', text: `Downloaded record: ${rec.diagnosis || 'Report'}` })
  }

  // Filter patients: strictly include only patients who have appointments/consultations with this doctor
  const myPatients = patients.filter((p) => {
    // Exclude if patient record is the logged-in doctor themselves
    if (user?.id && (Number(p.id) === Number(user.id) || p.email?.toLowerCase() === user.email?.toLowerCase())) {
      return false
    }
    // Must have had at least 1 appointment or consultation with this doctor
    return (p.totalAppointments ?? 0) > 0
  })

  // Filter patients by search term
  const filteredPatients = myPatients.filter((p) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      p.name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      String(p.id).includes(term) ||
      p.bloodGroup?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Care Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review patient roster, consult histories, emergency contacts, and electronic health records.
          </p>
        </div>
        {activePatient && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivePatient(null)}
            className="text-xs gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Patient Directory
          </Button>
        )}
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
          <button
            onClick={() => setAlert({ type: '', text: '' })}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main View: Patient List or Detailed Patient Clinical Records */}
      {!activePatient ? (
        <div className="space-y-4">
          {/* Search bar & summary */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search patient by name, email, ID or blood group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs w-full"
              />
            </div>
            <div className="text-xs font-semibold text-muted-foreground shrink-0">
              {filteredPatients.length} patient(s) found
            </div>
          </div>

          {loadingPatients ? (
            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
          ) : filteredPatients.length === 0 ? (
            <Card className="border-border/80 shadow-2xs">
              <CardContent className="py-16 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-semibold text-slate-800">No patients found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchTerm
                    ? `No patients match "${searchTerm}". Try a different search.`
                    : 'No patients have booked appointments with you yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className="border-border/80 shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => setActivePatient(patient)}
                >
                  <CardContent className="p-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
                          {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{patient.name}</h3>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              #{patient.id}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {patient.email}
                          </p>
                        </div>
                      </div>
                      {patient.latestStatus && <StatusBadge status={patient.latestStatus} />}
                    </div>

                    {/* Patient Health Badges */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Droplet className="w-3.5 h-3.5 text-rose-500" />
                        <span>Blood: <strong>{patient.bloodGroup || 'Not set'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">Emergency: <strong>{patient.emergencyContact || 'None'}</strong></span>
                      </div>
                    </div>

                    {/* Appointment metrics */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[11px] text-muted-foreground">Visits: </span>
                        <strong className="text-slate-800">{patient.totalAppointments || 0} consultation(s)</strong>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2 text-primary font-semibold gap-1 hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActivePatient(patient)
                        }}
                      >
                        Clinical History
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Patient Clinical History & Records View */
        <div className="space-y-6">
          {/* Patient Overview Card */}
          <Card className="border-border/80 shadow-2xs bg-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white font-bold flex items-center justify-center text-lg shadow-2xs">
                    {activePatient.name?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{activePatient.name}</h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 text-primary border border-primary/30">
                        Patient #{activePatient.id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{activePatient.email}</span>
                      {activePatient.gender && <span>• {activePatient.gender}</span>}
                      {activePatient.bloodGroup && <span>• Blood Group: {activePatient.bloodGroup}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActivePatient(null)}
                    className="text-xs"
                  >
                    View All Patients
                  </Button>
                </div>
              </div>

              {activePatient.allergies && (
                <div className="mt-3.5 pt-3 border-t border-primary/15 text-xs text-slate-700">
                  <span className="font-semibold text-destructive">Known Allergies: </span>
                  {activePatient.allergies}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Records List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Electronic Medical Records ({records.length})
                </h3>
                {fetchingRecords && (
                  <span className="text-xs text-primary animate-pulse">Refreshing records...</span>
                )}
              </div>

              <Button
                size="sm"
                onClick={handleOpenUploadModal}
                className="text-xs gap-1.5 shadow-2xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Record / Upload Lab Report
              </Button>
            </div>

            {loadingRecords ? (
              <div className="py-16 flex justify-center"><LoadingSpinner /></div>
            ) : records.length === 0 ? (
              <Card className="border-border/80 shadow-2xs">
                <CardContent className="py-14 text-center space-y-3">
                  <HeartPulse className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-800">
                    No clinical records filed yet
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    This patient has no recorded diagnoses or prescription history in this view. Click "Add Record / Upload Lab Report" above to file a diagnostic report or prescription for {activePatient.name}.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenUploadModal}
                    className="text-xs gap-1.5 mx-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    File First Medical Record
                  </Button>
                </CardContent>
              </Card>
            ) : (
              records.map((rec) => (
                <Card key={rec.id} className="border-border/80 shadow-2xs">
                  <CardContent className="p-5 space-y-3.5">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{rec.diagnosis}</h4>
                          {rec.recordType && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {rec.recordType}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Recorded on {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : 'Recent'} • {rec.doctorName || (rec.doctorId ? `Consulting Doctor #${rec.doctorId}` : 'Attending Physician')}
                          {rec.doctorSpecialization && ` (${rec.doctorSpecialization})`}
                        </p>
                      </div>
                      {rec.followUpDate && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md shrink-0">
                          Follow-up: {rec.followUpDate}
                        </span>
                      )}
                    </div>

                    {rec.notes && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs text-slate-700">
                        <strong>Physician Notes:</strong> {rec.notes}
                      </div>
                    )}

                    {rec.attachmentName && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg w-fit">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Attached Document: <strong>{rec.attachmentName}</strong> {rec.attachmentSize ? `(${rec.attachmentSize})` : ''}</span>
                      </div>
                    )}

                    {rec.prescriptions?.length > 0 && (
                      <div className="pt-2 border-t border-border/60 space-y-1.5">
                        <h5 className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-primary" />
                          Prescriptions ({rec.prescriptions.length})
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rec.prescriptions.map((p, idx) => (
                            <div
                              key={p.id || idx}
                              className="p-2.5 rounded-lg border border-border/80 bg-slate-50/60 text-xs"
                            >
                              <div className="font-semibold text-slate-900">{p.medicineName}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {p.dosage} • {p.frequency} • {p.durationDays ? `${p.durationDays} days` : ''}
                              </div>
                              {p.instructions && (
                                <div className="text-[10px] text-slate-600 mt-1 italic">
                                  "{p.instructions}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(rec)}
                          className="text-xs h-8 gap-1.5 text-emerald-700 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/80 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Lab Report & EHR (PDF)
                        </Button>
                        {rec.attachmentData && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewDoc(rec)}
                            className="text-xs h-8 gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview Document
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to permanently delete this clinical record?')) {
                            deleteMutation.mutate(rec.id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Record
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add / Upload Medical Record Modal for Doctor */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-border/80 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border/80 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">File Clinical Record & Diagnostic Report</h3>
                  <p className="text-xs text-muted-foreground">
                    For patient: <strong className="text-slate-800">{activePatient?.name}</strong> (#{activePatient?.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitUpload} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Diagnosis / Report Title *</Label>
                  <Input
                    required
                    placeholder="e.g., Complete Blood Count (CBC) / Viral Fever"
                    value={uploadFormData.diagnosis}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, diagnosis: e.target.value })}
                    className="text-xs mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Record Type</Label>
                  <select
                    className="w-full text-xs rounded-md border border-input bg-transparent px-3 py-2 mt-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                    value={uploadFormData.recordType}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, recordType: e.target.value })}
                  >
                    <option value="Diagnostic Lab Report">Diagnostic Lab Report</option>
                    <option value="Physician Clinical Consultation">Physician Clinical Consultation</option>
                    <option value="Prescription & Treatment">Prescription & Treatment</option>
                    <option value="Radiology & Imaging Report">Radiology & Imaging Report</option>
                    <option value="Hospital Discharge Summary">Hospital Discharge Summary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Consultation / Test Date</Label>
                  <Input
                    type="date"
                    value={uploadFormData.consultationDate}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, consultationDate: e.target.value })}
                    className="text-xs mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Follow-up Date (Optional)</Label>
                  <Input
                    type="date"
                    value={uploadFormData.followUpDate}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, followUpDate: e.target.value })}
                    className="text-xs mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Clinical Findings & Doctor Notes</Label>
                <textarea
                  rows={3}
                  placeholder="Record symptoms, observations, lab evaluation notes, or physician recommendations..."
                  value={uploadFormData.notes}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, notes: e.target.value })}
                  className="w-full text-xs rounded-md border border-input bg-transparent p-3 mt-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Lab File Attachment */}
              <div className="p-3.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-2">
                <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-primary" />
                  Attach Lab Document or Diagnostic Report (PDF, PNG, JPG)
                </Label>
                <Input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="text-xs bg-white"
                />
                {uploadFormData.attachmentName && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Attached: {uploadFormData.attachmentName} ({uploadFormData.attachmentSize})
                  </p>
                )}
              </div>

              {/* Prescriptions Section */}
              <div className="space-y-3 pt-2 border-t border-border/80">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-primary" />
                    Prescribed Medications ({uploadPrescriptions.length})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPrescription}
                    className="text-xs h-7 px-2.5 gap-1 text-primary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Medicine
                  </Button>
                </div>

                {uploadPrescriptions.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-center">
                    No medications prescribed yet. Click "Add Medicine" to prescribe medications with this report.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadPrescriptions.map((p, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-border/80 bg-slate-50 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input
                            placeholder="Medicine name (e.g., Amoxicillin 500mg)"
                            value={p.medicineName}
                            onChange={(e) => handlePrescriptionChange(idx, 'medicineName', e.target.value)}
                            className="text-xs bg-white"
                          />
                          <Input
                            placeholder="Dosage (e.g., 1 tablet)"
                            value={p.dosage}
                            onChange={(e) => handlePrescriptionChange(idx, 'dosage', e.target.value)}
                            className="text-xs bg-white"
                          />
                          <Input
                            placeholder="Frequency (e.g., Twice daily)"
                            value={p.frequency}
                            onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                            className="text-xs bg-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Duration (Days)"
                            value={p.durationDays}
                            onChange={(e) => handlePrescriptionChange(idx, 'durationDays', e.target.value)}
                            className="text-xs bg-white w-32"
                          />
                          <Input
                            placeholder="Instructions (e.g., After meals with plenty of water)"
                            value={p.instructions}
                            onChange={(e) => handlePrescriptionChange(idx, 'instructions', e.target.value)}
                            className="text-xs bg-white flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePrescription(idx)}
                            className="text-xs h-8 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={uploadRecordMutation.isPending}
                  className="text-xs font-semibold gap-1.5 shadow-2xs"
                >
                  {uploadRecordMutation.isPending ? 'Filing Record...' : 'Save & Publish Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                  {previewDoc.attachmentName || 'Diagnostic Report Document'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleDownload(previewDoc)}
                  className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white h-8"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50 min-h-[400px]">
              {previewDoc.attachmentType?.startsWith('image/') || previewDoc.attachmentData?.startsWith('data:image/') ? (
                <img
                  src={previewDoc.attachmentData}
                  alt={previewDoc.attachmentName}
                  className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-xs border"
                />
              ) : previewDoc.attachmentType?.includes('pdf') || previewDoc.attachmentData?.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDoc.attachmentData}
                  title={previewDoc.attachmentName}
                  className="w-full h-[75vh] rounded-lg border shadow-xs"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-12 h-12 text-primary/60 mx-auto" />
                  <p className="text-xs text-slate-700 font-medium">
                    {previewDoc.attachmentName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Direct browser preview unavailable for this format. Please download the file to view.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(previewDoc)}
                    className="text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
