import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ArrowRight,
} from 'lucide-react'
import { publicApi } from '@/api/public'
import { doctorApi } from '@/api/doctor'
import { appointmentsApi } from '@/api/appointments'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function BookAppointmentPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => {
    // Tomorrow as default date in YYYY-MM-DD
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })

  // 1. Fetch departments
  const { data: deptData } = useQuery({
    queryKey: ['public-departments'],
    queryFn: () => publicApi.getDepartments({ page: 0, size: 50 }),
  })

  // 2. Fetch doctors (optionally filtered by department)
  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['public-doctors', selectedDeptId],
    queryFn: () =>
      publicApi.getDoctors({
        departmentId: selectedDeptId ? Number(selectedDeptId) : undefined,
        page: 0,
        size: 50,
      }),
  })

  // 3. Fetch available slots for the selected doctor & date
  const { data: slotsData, isLoading: loadingSlots, isFetching: fetchingSlots } = useQuery({
    queryKey: ['doctor-slots', selectedDoctorId, selectedDate],
    queryFn: () => doctorApi.getSlots(Number(selectedDoctorId), selectedDate),
    enabled: !!selectedDoctorId && !!selectedDate,
  })

  // Booking mutation
  const bookMutation = useMutation({
    mutationFn: (payload) => appointmentsApi.bookAppointment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] })
      const doctorName = currentDoctor?.name ? `Dr. ${currentDoctor.name}` : 'the doctor'
      setStatusMessage({
        type: 'success',
        text: `Appointment booked! An email notification has been sent to ${doctorName} to confirm your appointment.`,
      })
      setTimeout(() => {
        navigate('/patient/appointments')
      }, 2200)
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to book appointment. Please choose another slot.',
      })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedDoctorId) {
      setStatusMessage({ type: 'error', text: 'Please select a doctor.' })
      return
    }
    if (!selectedDate || !selectedSlot) {
      setStatusMessage({ type: 'error', text: 'Please choose an available appointment time slot.' })
      return
    }
    if (!reason.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify the reason for consultation.' })
      return
    }

    const appointmentTime = `${selectedDate}T${selectedSlot}`
    bookMutation.mutate({
      doctorId: Number(selectedDoctorId),
      appointmentTime,
      reason,
    })
  }

  const doctors = doctorsData?.content || []
  const departments = deptData?.content || []
  const availableSlots = slotsData?.availableSlots || []

  // Selected doctor info
  const currentDoctor = doctors.find((d) => d.id === Number(selectedDoctorId))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Book an Appointment</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Select a department, doctor, and date to inspect available consulting slots.
        </p>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-destructive/10 border border-destructive/20 text-destructive'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{statusMessage.text}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Doctor & Department Filter */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value)
                  setSelectedDoctorId('')
                  setSelectedSlot('')
                }}
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Select Doctor
              </CardTitle>
              <CardDescription className="text-xs">
                {doctors.length} doctor(s) available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {loadingDoctors ? (
                <div className="py-6 flex justify-center"><LoadingSpinner /></div>
              ) : doctors.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No doctors found for this criteria.
                </p>
              ) : (
                doctors.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setSelectedDoctorId(String(doc.id))
                      setSelectedSlot('')
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      selectedDoctorId === String(doc.id)
                        ? 'border-primary bg-primary/5 shadow-2xs ring-1 ring-primary'
                        : 'border-border/80 hover:bg-muted/50'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{doc.name}</div>
                    <div className="text-[11px] text-primary font-medium mt-0.5">
                      {doc.specialization}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{doc.email}</div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Date, Real Slots, & Consultation Reason */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Appointment Schedule</CardTitle>
              <CardDescription className="text-xs">
                Choose consulting date and available slot from live schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-semibold text-slate-700">
                    Appointment Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setSelectedDate(e.target.value)
                        setSelectedSlot('')
                      }}
                      className="text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Available Slots Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700">
                      Available Time Slots
                    </Label>
                    {fetchingSlots && <span className="text-[10px] text-primary animate-pulse">Refreshing slots...</span>}
                  </div>

                  {!selectedDoctorId ? (
                    <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      Please select a doctor on the left to inspect available slots.
                    </div>
                  ) : loadingSlots ? (
                    <div className="py-6 flex justify-center"><LoadingSpinner /></div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-border bg-slate-50/50 text-center text-xs text-muted-foreground space-y-1">
                      <Clock className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                      <p className="font-semibold text-slate-700">No open slots on {selectedDate}</p>
                      <p>The doctor may be on leave or fully booked. Try selecting a different date.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                            selectedSlot === slot
                              ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                              : 'bg-card border-border hover:border-primary/50 text-slate-800'
                          }`}
                        >
                          {slot.substring(0, 5)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reason for Appointment */}
                <div className="space-y-1.5">
                  <Label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                    Reason for Appointment
                  </Label>
                  <textarea
                    id="reason"
                    rows={3}
                    placeholder="Describe symptoms or purpose of appointment (e.g. Chest pain follow-up, Routine checkup)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 rounded-lg border border-input bg-card text-xs text-slate-900 placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>

                {/* Summary Card before confirmation */}
                {currentDoctor && selectedSlot && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-slate-800 space-y-1">
                    <p className="font-semibold text-primary">Booking Summary:</p>
                    <p>Doctor: <strong>{currentDoctor.name}</strong> ({currentDoctor.specialization})</p>
                    <p>Time: <strong>{selectedDate} at {selectedSlot.substring(0, 5)}</strong></p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2 font-semibold shadow-xs"
                  disabled={bookMutation.isPending || !selectedSlot}
                >
                  {bookMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Booking appointment...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Confirm & Book Appointment
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
