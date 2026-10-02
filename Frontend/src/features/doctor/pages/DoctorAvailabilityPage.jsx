import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CalendarOff,
} from 'lucide-react'
import { doctorApi } from '@/api/doctor'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export function DoctorAvailabilityPage() {
  const queryClient = useQueryClient()
  const [alert, setAlert] = useState({ type: '', text: '' })

  // Leave Form State
  const [leaveDate, setLeaveDate] = useState('')
  const [leaveReason, setLeaveReason] = useState('')

  // Query Schedule
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['doctor-availability'],
    queryFn: () => doctorApi.getAvailability(),
  })

  // Shifts state
  const [shifts, setShifts] = useState([
    { dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '13:00:00' },
    { dayOfWeek: 'WEDNESDAY', startTime: '14:00:00', endTime: '18:00:00' },
  ])

  // Sync shifts once loaded
  React.useEffect(() => {
    if (scheduleData?.availabilities?.length) {
      setShifts(
        scheduleData.availabilities.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        }))
      )
    }
  }, [scheduleData])

  // Save Schedule Mutation
  const saveScheduleMutation = useMutation({
    mutationFn: (availabilities) => doctorApi.setAvailability({ availabilities }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] })
      setAlert({ type: 'success', text: 'Weekly consulting shifts successfully updated.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update schedule.',
      })
    },
  })

  // Apply Leave Mutation
  const leaveMutation = useMutation({
    mutationFn: (payload) => doctorApi.addLeave(payload),
    onSuccess: (_, variables) => {
      setLeaveDate('')
      setLeaveReason('')
      setAlert({
        type: 'success',
        text: `Leave recorded for ${variables.leaveDate}. Slots on this day have been blocked.`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to apply leave.',
      })
    },
  })

  const handleAddShift = () => {
    setShifts([
      ...shifts,
      { dayOfWeek: 'FRIDAY', startTime: '09:00:00', endTime: '13:00:00' },
    ])
  }

  const handleRemoveShift = (index) => {
    setShifts(shifts.filter((_, i) => i !== index))
  }

  const handleShiftChange = (index, field, value) => {
    const updated = [...shifts]
    updated[index][field] = value
    setShifts(updated)
  }

  const handleSaveSchedule = (e) => {
    e.preventDefault()
    saveScheduleMutation.mutate(shifts)
  }

  const handleApplyLeave = (e) => {
    e.preventDefault()
    if (!leaveDate) {
      setAlert({ type: 'error', text: 'Please select leave date.' })
      return
    }
    leaveMutation.mutate({
      leaveDate,
      reason: leaveReason || undefined,
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Availability & Leave Management
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Define recurring weekly consulting hours and register planned leaves to maintain slot accuracy.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Schedule Editor */}
        <div className="lg:col-span-2">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Weekly Consulting Hours</CardTitle>
                <CardDescription className="text-xs">
                  Active time windows where patients can book 30-min appointments
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddShift}
                className="text-xs gap-1 h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Shift
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center"><LoadingSpinner /></div>
              ) : (
                <form onSubmit={handleSaveSchedule} className="space-y-4">
                  {shifts.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center italic">
                      No weekly shifts configured. Click "Add Shift" above.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {shifts.map((shift, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-3 rounded-lg border border-border/80 bg-slate-50/50 text-xs"
                        >
                          <select
                            value={shift.dayOfWeek}
                            onChange={(e) => handleShiftChange(idx, 'dayOfWeek', e.target.value)}
                            className="h-8 px-2 rounded-md border border-input bg-card text-xs font-medium"
                          >
                            {DAYS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1.5 flex-1">
                            <Input
                              type="time"
                              value={shift.startTime.substring(0, 5)}
                              onChange={(e) =>
                                handleShiftChange(idx, 'startTime', `${e.target.value}:00`)
                              }
                              className="text-xs h-8"
                            />
                            <span className="text-muted-foreground text-xs">to</span>
                            <Input
                              type="time"
                              value={shift.endTime.substring(0, 5)}
                              onChange={(e) =>
                                handleShiftChange(idx, 'endTime', `${e.target.value}:00`)
                              }
                              className="text-xs h-8"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveShift(idx)}
                            className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-border/60">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={saveScheduleMutation.isPending}
                      className="shadow-xs font-medium"
                    >
                      {saveScheduleMutation.isPending ? 'Saving...' : 'Save Weekly Schedule'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Apply for Leave Form */}
        <div className="lg:col-span-1">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-amber-600" />
                Apply for Leave
              </CardTitle>
              <CardDescription className="text-xs">
                Temporarily blocks patient bookings on that date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApplyLeave} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="leaveDate" className="text-xs font-semibold text-slate-700">
                    Leave Date *
                  </Label>
                  <Input
                    id="leaveDate"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="leaveReason" className="text-xs font-semibold text-slate-700">
                    Reason (optional)
                  </Label>
                  <textarea
                    id="leaveReason"
                    rows={3}
                    placeholder="e.g. Medical conference, Personal leave..."
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-input text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="w-full text-xs font-medium border-amber-300 text-amber-800 hover:bg-amber-50"
                  disabled={leaveMutation.isPending}
                >
                  {leaveMutation.isPending ? 'Recording Leave...' : 'Submit Leave Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
