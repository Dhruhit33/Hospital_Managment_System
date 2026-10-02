import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  CheckCircle2,
  Stethoscope,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Activity,
  Users,
  CalendarCheck,
  Search,
  Filter,
  FileEdit,
  ClipboardList,
  AlertCircle,
  CalendarDays,
  Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { doctorApi } from '@/api/doctor'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function DoctorDashboard() {
  const user = useAuthStore((state) => state.user)
  const [filterTab, setFilterTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch appointments for this doctor
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['doctor-dashboard-appointments'],
    queryFn: () => doctorApi.getMyAppointments(),
  })

  // Fetch doctor availability schedule
  const { data: availabilityData } = useQuery({
    queryKey: ['doctor-dashboard-availability'],
    queryFn: () => doctorApi.getAvailability(),
    retry: false,
  })

  const appointments = (Array.isArray(appointmentsData) ? appointmentsData : []).filter((apt) => {
    if (apt.doctor?.id && user?.id) {
      return Number(apt.doctor.id) === Number(user.id)
    }
    if (apt.doctor?.email && user?.email) {
      return apt.doctor.email.toLowerCase() === user.email.toLowerCase()
    }
    return true
  })
  const todayStr = new Date().toISOString().split('T')[0]
  const todayAppointments = appointments.filter((a) => a.appointmentTime?.startsWith(todayStr))

  const waitingCount = appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').length
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length
  const totalCount = appointments.length

  // Filtered list based on active tab and search
  const filteredAppointments = appointments.filter((apt) => {
    if (filterTab === 'WAITING' && apt.status !== 'BOOKED' && apt.status !== 'CONFIRMED') return false
    if (filterTab === 'COMPLETED' && apt.status !== 'COMPLETED') return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const reason = (apt.reason || '').toLowerCase()
      const idMatch = String(apt.id).includes(q)
      const patientMatch = String(apt.patientId || '').includes(q)
      return reason.includes(q) || idMatch || patientMatch
    }
    return true
  })

  const doctorName = user?.name || user?.username?.split('@')[0] || 'Physician'
  const shifts = availabilityData?.availabilities || []

  return (
    <div className="space-y-6 pb-10">
      {/* 1. PHYSICIAN OPERATIONAL HEADER STRIP */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-500/20 shrink-0">
            Dr
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Dr. {doctorName}, MD
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                On Duty
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Outpatient Clinical Suite • CarePoint Medical Network
            </p>
          </div>
        </div>

        {/* Live Segmented Metrics Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="flex items-center rounded-2xl bg-slate-50 p-1.5 border border-slate-200/90 text-xs">
            <div className="px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Queue</span>
              <span className="text-base font-extrabold text-blue-700">{waitingCount}</span>
            </div>
            <div className="w-px h-7 bg-slate-200 mx-1" />
            <div className="px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed</span>
              <span className="text-base font-extrabold text-emerald-700">{completedCount}</span>
            </div>
            <div className="w-px h-7 bg-slate-200 mx-1" />
            <div className="px-3 py-1.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
              <span className="text-base font-extrabold text-slate-900">{totalCount}</span>
            </div>
          </div>

          <Link to="/doctor/availability">
            <Button variant="outline" className="h-10 px-3.5 rounded-xl text-xs font-bold gap-1.5 border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Adjust Shifts
            </Button>
          </Link>
          <Link to="/doctor/patients">
            <Button className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20">
              <Users className="w-3.5 h-3.5" />
              Patient Records
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: CLINICAL QUEUE BOARD (8 cols) + SCHEDULE TIMELINE (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (8 cols): Patient Consultation Intake Board */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Queue Board Filter Tabs & Search Header */}
            <div className="p-5 border-b border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                    Patient Consultation Queue
                  </h2>
                  <p className="text-xs text-slate-500">Live clinical intake and consultation workflow</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setFilterTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    onClick={() => setFilterTab('WAITING')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterTab === 'WAITING' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-blue-700'
                    }`}
                  >
                    Waiting ({waitingCount})
                  </button>
                  <button
                    onClick={() => setFilterTab('COMPLETED')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      filterTab === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    Done ({completedCount})
                  </button>
                </div>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by diagnosis reason, appointment #, or patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Queue Item Rows */}
            <div className="p-5">
              {isLoading ? (
                <div className="py-16 flex justify-center"><LoadingSpinner /></div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-14 px-4 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Queue is clear</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery ? 'No appointments match your search criteria.' : 'No patients currently waiting for consultation.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.map((apt, index) => {
                    const timeStr = apt.appointmentTime
                      ? new Date(apt.appointmentTime).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Scheduled'
                    const dateStr = apt.appointmentTime
                      ? new Date(apt.appointmentTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''

                    return (
                      <div
                        key={apt.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-emerald-50/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Queue Position Pill */}
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center font-mono font-bold text-xs text-slate-700 shadow-2xs shrink-0">
                            <span className="text-[9px] text-slate-400 -mb-0.5">SLOT</span>
                            <span>#{index + 1}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900">
                                Consultation #{apt.id}
                              </span>
                              <StatusBadge status={apt.status} />
                            </div>
                            <p className="text-xs text-slate-700 font-medium">
                              <strong>Complaint:</strong> {apt.reason || 'General clinical assessment'}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dateStr} • {timeStr}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                          <Link to="/doctor/appointments">
                            <Button size="sm" className="h-8 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs">
                              <FileEdit className="w-3.5 h-3.5 mr-1" />
                              Manage Visit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right (4 cols): Shift Schedule & Doctor Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Shift Hours Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  Weekly Availability
                </h3>
                <p className="text-[11px] text-slate-500">Configured clinic shift hours</p>
              </div>
              <Link to="/doctor/availability" className="text-xs font-bold text-emerald-600 hover:underline">
                Edit
              </Link>
            </div>

            <div className="p-4 space-y-2.5">
              {shifts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  <p>No active shift configured.</p>
                  <Link to="/doctor/availability">
                    <Button size="sm" variant="outline" className="mt-2 text-xs text-emerald-700 border-emerald-200">
                      Set Active Working Hours
                    </Button>
                  </Link>
                </div>
              ) : (
                shifts.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs"
                  >
                    <span className="font-bold text-slate-800">{s.dayOfWeek}</span>
                    <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      {s.startTime} - {s.endTime}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clinical Workstation Tools */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Clinical Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/doctor/appointments"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  <span>Review All Scheduled Appointments</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/doctor/patients"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Search Patient Directory & History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
