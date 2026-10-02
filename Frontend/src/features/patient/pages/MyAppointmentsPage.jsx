import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  XCircle,
  RotateCw,
  Trash2,
  Mail,
  Download,
  FileText,
} from 'lucide-react'
import { appointmentsApi } from '@/api/appointments'
import { doctorApi } from '@/api/doctor'
import { recordsApi } from '@/api/records'
import { downloadReportFile } from '@/lib/reportDownload'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function MyAppointmentsPage() {
  const queryClient = useQueryClient()
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [newTime, setNewTime] = useState('')
  const [actionAlert, setActionAlert] = useState({ type: '', text: '' })
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Query appointments for current patient
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: async () => {
      try {
        const res = await appointmentsApi.getPatientAppointments()
        return Array.isArray(res) ? res : []
      } catch (e) {
        return []
      }
    },
  })

  // Delete cancelled appointment mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => appointmentsApi.deleteAppointment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] })
      setActionAlert({ type: 'success', text: `Cancelled appointment #${id} was removed.` })
    },
    onError: (err) => {
      setActionAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete appointment.',
      })
    },
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => appointmentsApi.cancelAppointment(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] })
      setCancelModalOpen(false)
      setCancelReason('')
      setActionAlert({ type: 'success', text: 'Appointment was cancelled successfully.' })
    },
    onError: (err) => {
      setActionAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel appointment.',
      })
    },
  })

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, newAppointmentTime }) =>
      appointmentsApi.rescheduleAppointment(id, { newAppointmentTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] })
      setRescheduleModalOpen(false)
      setNewTime('')
      setActionAlert({ type: 'success', text: 'Appointment rescheduled successfully.' })
    },
    onError: (err) => {
      setActionAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reschedule appointment.',
      })
    },
  })

  const handleOpenCancel = (apt) => {
    setSelectedAppointment(apt)
    setCancelReason('')
    setCancelModalOpen(true)
    setActionAlert({ type: '', text: '' })
  }

  const handleOpenReschedule = (apt) => {
    setSelectedAppointment(apt)
    setNewTime('')
    setRescheduleModalOpen(true)
    setActionAlert({ type: '', text: '' })
  }

  const handleDownloadAppointmentReport = async (apt) => {
    try {
      let record = null
      try {
        record = await recordsApi.getRecordByAppointmentId(apt.id)
      } catch (e) {
        const authRaw = localStorage.getItem('carepoint_auth')
        const userId = authRaw ? JSON.parse(authRaw)?.user?.id : 'default'
        const stored = JSON.parse(localStorage.getItem(`carepoint_records_${userId}`) || '[]')
        record = stored.find((r) => r.appointmentId === apt.id)
      }

      downloadReportFile({
        attachmentData: record?.attachmentData,
        attachmentName: record?.attachmentName,
        diagnosis: record?.diagnosis || apt.reason || 'Completed Medical Consultation',
        notes: record?.notes || 'Clinical consultation concluded successfully.',
        prescriptions: record?.prescriptions || [],
        patientName: apt.patient?.name || 'Patient',
        doctorName: apt.doctor?.name || 'Physician',
        doctorSpecialization: apt.doctor?.specialization || 'Clinical Medicine',
        date: apt.appointmentDate || (apt.appointmentTime ? new Date(apt.appointmentTime).toLocaleDateString() : new Date().toLocaleDateString()),
        id: record?.id,
        appointmentId: apt.id,
      })

      setActionAlert({
        type: 'success',
        text: `Diagnostic Lab Report for Visit #${apt.id} downloaded successfully.`,
      })
    } catch (err) {
      setActionAlert({
        type: 'error',
        text: 'Failed to download report. Please check Medical Records page.',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Appointments</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track, reschedule, or cancel your scheduled medical consultations.
          </p>
        </div>
        <Link to="/patient/book">
          <Button size="sm" className="gap-2 shadow-xs font-semibold">
            <CalendarPlus className="w-4 h-4" />
            Book New
          </Button>
        </Link>
      </div>

      {actionAlert.text && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-medium ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-destructive/10 border border-destructive/20 text-destructive'
          }`}
        >
          {actionAlert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{actionAlert.text}</div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        {[
          { key: 'ALL', label: 'All', count: appointments.length },
          { key: 'ACTIVE', label: 'Active', count: appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').length },
          { key: 'COMPLETED', label: 'Completed', count: appointments.filter((a) => a.status === 'COMPLETED').length },
          { key: 'CANCELLED', label: 'Cancelled', count: appointments.filter((a) => a.status === 'CANCELLED').length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                : 'bg-muted/50 text-slate-600 hover:bg-muted hover:text-slate-900 border border-border/60'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner /></div>
      ) : appointments.length === 0 ? (
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="py-16 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800">No scheduled appointments</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You do not have any upcoming visits booked. Search for our specialist doctors and reserve a slot.
              </p>
            </div>
            <Link to="/patient/book" className="inline-block pt-2">
              <Button size="sm">Book Your First Visit</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments
            .filter((apt) => {
              if (statusFilter === 'ALL') return true
              if (statusFilter === 'ACTIVE') return apt.status === 'BOOKED' || apt.status === 'CONFIRMED'
              return apt.status === statusFilter
            })
            .map((apt) => (
            <Card key={apt.id} className="border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {apt.doctor?.name || 'Assigned Specialist'}
                    </h3>
                    <p className="text-xs text-primary font-medium">
                      {apt.doctor?.specialization || 'Clinical Medicine'}
                    </p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>

                <div className="space-y-2 text-xs text-slate-700 bg-muted/40 p-3 rounded-lg border border-border/60">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>
                      {apt.appointmentTime
                        ? new Date(apt.appointmentTime).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Time not set'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <strong>Reason:</strong> {apt.reason || 'General checkup'}
                  </div>
                  {apt.cancelReason && (
                    <div className="text-[11px] text-destructive">
                      <strong>Cancellation Note:</strong> {apt.cancelReason}
                    </div>
                  )}
                </div>

                {apt.status === 'BOOKED' && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/70 text-blue-800 text-[11px] font-medium">
                    <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Booking notification sent to Dr. {apt.doctor?.name || 'doctor'}. Awaiting doctor's confirmation.</span>
                  </div>
                )}

                {apt.status === 'CONFIRMED' && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-emerald-800 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Confirmed by Dr. {apt.doctor?.name || 'doctor'}. Confirmation email dispatched to your inbox.</span>
                  </div>
                )}

                {/* Actions if still active */}
                {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReschedule(apt)}
                      className="text-xs h-8 gap-1.5"
                    >
                      <RotateCw className="w-3 h-3" />
                      Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCancel(apt)}
                      className="text-xs h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                    >
                      <XCircle className="w-3 h-3" />
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Completed visit actions: Download Lab Report / Prescription */}
                {apt.status === 'COMPLETED' && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 flex-wrap">
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Consultation Completed
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5 font-semibold ml-auto"
                      onClick={() => handleDownloadAppointmentReport(apt)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Lab Report / EHR
                    </Button>
                  </div>
                )}

                {/* Cancelled visit actions */}
                {apt.status === 'CANCELLED' && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 flex-wrap">
                    <span className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-rose-500" />
                      Cancelled • Auto-purged after 24h
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(apt.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs h-8 gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Cancel Appointment #{selectedAppointment?.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Are you sure you want to cancel this consultation with{' '}
                <strong>{selectedAppointment?.doctor?.name}</strong>?
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, feeling better..."
                  className="w-full p-2.5 rounded-lg border border-input text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={cancelMutation.isPending}
                >
                  Keep Appointment
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    cancelMutation.mutate({
                      id: selectedAppointment?.id,
                      reason: cancelReason,
                    })
                  }
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Reschedule Appointment #{selectedAppointment?.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Select a new date and time for your consultation with{' '}
                <strong>{selectedAppointment?.doctor?.name}</strong>.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  New Appointment Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newTime}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRescheduleModalOpen(false)}
                  disabled={rescheduleMutation.isPending}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    rescheduleMutation.mutate({
                      id: selectedAppointment?.id,
                      newAppointmentTime: newTime,
                    })
                  }
                  disabled={rescheduleMutation.isPending || !newTime}
                >
                  {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm New Time'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
