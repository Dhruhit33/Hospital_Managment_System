import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarPlus,
  Calendar,
  FileText,
  CreditCard,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
  Activity,
  Sparkles,
  Stethoscope,
  ChevronRight,
  HeartPulse,
  PhoneCall,
  User,
  Pill,
  CheckCircle2,
  Building,
  ShieldAlert,
  Download,
  Filter,
  Search,
  ExternalLink,
  MapPin,
  Heart,
  Droplets,
  CalendarCheck2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { publicApi } from '@/api/public'
import { recordsApi } from '@/api/records'
import { billingApi } from '@/api/billing'
import { insuranceApi } from '@/api/insurance'
import { patientApi } from '@/api/patient'
import { doctorApi } from '@/api/doctor'
import { appointmentsApi } from '@/api/appointments'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function PatientDashboard() {
  const user = useAuthStore((state) => state.user)
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('All')

  // Fetch patient profile
  const { data: profile } = useQuery({
    queryKey: ['patient-profile-dashboard'],
    queryFn: () => patientApi.getProfile(),
    retry: false,
  })

  // Fetch doctors for care team
  const { data: doctorsData, isLoading: loadingDoctors } = useQuery({
    queryKey: ['patient-care-team'],
    queryFn: () => publicApi.getDoctors({ page: 0, size: 5 }),
  })

  // Fetch patient records
  const { data: recordsData, isLoading: loadingRecords } = useQuery({
    queryKey: ['patient-records-preview'],
    queryFn: () => recordsApi.getPatientRecords({ page: 0, size: 4 }),
  })

  // Fetch patient bills
  const { data: billsData, isLoading: loadingBills } = useQuery({
    queryKey: ['patient-bills-preview'],
    queryFn: () => billingApi.getPatientBills({ page: 0, size: 4 }),
  })

  // Fetch insurance
  const { data: insuranceData } = useQuery({
    queryKey: ['patient-insurance'],
    queryFn: () => insuranceApi.getInsurance(),
    retry: false,
  })

  // Fetch patient appointments
  const { data: appointmentsData } = useQuery({
    queryKey: ['patient-upcoming-appointments'],
    queryFn: async () => {
      try {
        const res = await appointmentsApi.getPatientAppointments()
        return Array.isArray(res) ? res : []
      } catch (e) {
        return []
      }
    },
    retry: false,
  })

  const bills = billsData?.content || []
  const records = recordsData?.content || []
  const doctors = doctorsData?.content || []
  const appointments = Array.isArray(appointmentsData) ? appointmentsData : []
  const pendingBills = bills.filter((b) => b.status === 'PENDING')
  const totalPendingAmount = pendingBills.reduce((acc, b) => acc + (b.patientPayable || 0), 0)

  const patientName = profile?.name || user?.name || user?.username?.split('@')[0] || 'Patient'
  const mrn = user?.id ? `MRN-10${user.id}4` : 'MRN-10024'

  // Nearest upcoming appointment if any
  const upcomingAppointment = appointments.find((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED')

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-7 pb-10">
      {/* 1. TOP AIRY GREETING & PATIENT STATUS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Hello, {patientName}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Active Member
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {todayDateStr} • CarePoint Health Network
          </p>
        </div>

        {/* Patient Vitals Pill Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-slate-700">{mrn}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs text-xs text-rose-700 font-bold">
            <Droplets className="w-3.5 h-3.5 text-rose-600" />
            <span>Blood: {profile?.bloodGroup || 'O+'}</span>
          </div>

          <Link to="/patient/book">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-xl gap-1.5 text-xs shadow-sm shadow-blue-500/25">
              <CalendarPlus className="w-3.5 h-3.5" />
              Book Consultation
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. PRIMARY CARE SHOWCASE BENTO GRID (Split 7 / 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side (7 cols): Next Consultation Feature Card OR Schedule Action */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="h-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-7 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
            {/* Ambient medical wave backdrop */}
            <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-15 pointer-events-none flex items-center justify-end pr-4">
              <svg viewBox="0 0 300 120" className="w-full h-full text-white fill-none stroke-current" strokeWidth="2">
                <path d="M 0,60 L 60,60 L 75,20 L 90,100 L 105,35 L 120,75 L 135,60 L 300,60" />
              </svg>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-cyan-300 text-xs font-bold tracking-wide border border-white/20">
                  <Clock className="w-3.5 h-3.5" />
                  Upcoming Consultation
                </span>
                <Link
                  to="/patient/appointments"
                  className="text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
                >
                  View calendar <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upcomingAppointment ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      Consultation with Dr. {upcomingAppointment.doctorName || 'CarePoint Specialist'}
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1">
                      Reason: {upcomingAppointment.reason || 'Routine Health Followup'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                      <div className="text-center pr-3 border-r border-white/20">
                        <span className="text-[10px] uppercase font-bold text-cyan-300 block">Date</span>
                        <span className="text-sm font-extrabold text-white">
                          {upcomingAppointment.appointmentTime
                            ? new Date(upcomingAppointment.appointmentTime).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Scheduled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-cyan-300 block">Time</span>
                        <span className="text-sm font-extrabold text-white font-mono">
                          {upcomingAppointment.appointmentTime
                            ? new Date(upcomingAppointment.appointmentTime).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '10:00 AM'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5">
                      <span className="text-[10px] uppercase font-bold text-slate-300 block">Location</span>
                      <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        Main Outpatient Clinic
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-1">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      No consultations scheduled this week
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-md">
                      Stay proactive with your health. Connect with board-certified physicians across cardiology, family medicine, and specialized care.
                    </p>
                  </div>

                  {/* Quick Specialty Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics'].map((spec) => (
                      <Link
                        key={spec}
                        to="/patient/book"
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-slate-200 transition-all hover:scale-105"
                      >
                        + {spec}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 pt-5 mt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Electronic Health Records Integrated
              </span>
              <Link to="/patient/book">
                <Button className="bg-white hover:bg-cyan-50 text-slate-900 font-bold h-9 px-4 rounded-xl text-xs gap-1.5 shadow-sm">
                  <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
                  Schedule Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side (5 cols): Personal Health Vitals & Wallet Matrix */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
          {/* Tile 1: Medical Records */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs card-hover-effect flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Records
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-extrabold text-slate-900 block">
                {recordsData?.totalElements ?? records.length}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Verified health notes</span>
            </div>
            <Link
              to="/patient/records"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 pt-1 border-t border-slate-100"
            >
              Access <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tile 2: Active Prescriptions */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs card-hover-effect flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Medications
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-extrabold text-slate-900 block">
                {records.reduce((acc, r) => acc + (r.prescriptions?.length || 0), 0)} Active
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Digital Rx scripts</span>
            </div>
            <Link
              to="/patient/records"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-1 border-t border-slate-100"
            >
              Pharmacy <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tile 3: Outstanding Co-Pay */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs card-hover-effect flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Copay Due
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <span className="text-2xl font-extrabold text-slate-900 block">
                ${totalPendingAmount.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {pendingBills.length > 0 ? `${pendingBills.length} Bill(s) pending` : 'All cleared'}
              </span>
            </div>
            <Link
              to="/patient/bills"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 pt-1 border-t border-slate-100"
            >
              Pay online <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tile 4: Health Insurance */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs card-hover-effect flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Insurance
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2 overflow-hidden">
              <span className="text-base font-extrabold text-slate-900 block truncate">
                {insuranceData?.provider || 'Self-Pay'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block truncate">
                {insuranceData?.coveragePercent ? `${insuranceData.coveragePercent}% Coverage` : 'No policy linked'}
              </span>
            </div>
            <Link
              to="/patient/insurance"
              className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 pt-1 border-t border-slate-100"
            >
              Policy <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. SLEEK HORIZONTAL CARE SERVICES DOCK */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-3">
          Quick Services
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/patient/book"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200/80 transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Book Visit</span>
          </Link>
          <Link
            to="/patient/records"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold border border-slate-200/80 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lab Reports</span>
          </Link>
          <Link
            to="/patient/bills"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 text-xs font-semibold border border-slate-200/80 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            <span>Invoices</span>
          </Link>
          <Link
            to="/patient/insurance"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 text-xs font-semibold border border-slate-200/80 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Insurance Claim</span>
          </Link>
          <Link
            to="/patient/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-semibold border border-slate-200/80 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-purple-600" />
            <span>Medical Profile</span>
          </Link>
        </div>
      </div>

      {/* 4. MAIN DUAL-COLUMN CLINICAL JOURNEY (8 cols left / 4 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Diagnostic Records & Invoices */}
        <div className="lg:col-span-8 space-y-6">
          {/* Medical Records Feed */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Clinical Consultation Notes & Diagnoses</h3>
                <p className="text-xs text-slate-500">Official medical entries and treatment evaluations</p>
              </div>
              <Link
                to="/patient/records"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                All records <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6">
              {loadingRecords ? (
                <div className="py-12 flex justify-center"><LoadingSpinner /></div>
              ) : records.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center border border-blue-100">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">No medical consultations recorded yet</h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                      Your diagnostic assessments, physician notes, and laboratory findings will appear here.
                    </p>
                  </div>
                  <Link to="/patient/book">
                    <Button size="sm" variant="outline" className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl">
                      Book Initial Visit
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {records.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">{rec.diagnosis}</span>
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                            #{rec.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {rec.notes || 'Routine physician clinical follow-up and evaluation.'}
                        </p>
                        {rec.prescriptions?.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <Pill className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px] font-semibold text-emerald-700">
                              {rec.prescriptions.length} Prescription(s) attached
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-[10px] font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs block">
                          {rec.followUpDate ? `Review: ${rec.followUpDate}` : 'Archived'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hospital Co-Pays & Bills */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hospital Billing & Invoices</h3>
                <p className="text-xs text-slate-500">Outpatient co-pays, insurance coverage, and settlements</p>
              </div>
              <Link
                to="/patient/bills"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                All bills <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6">
              {loadingBills ? (
                <div className="py-10 flex justify-center"><LoadingSpinner /></div>
              ) : bills.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>No outstanding balances. All hospital copays are settled.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {bills.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Invoice #{bill.id}</span>
                          <StatusBadge status={bill.status} />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Total: <strong className="text-slate-900 font-bold">${bill.totalAmount?.toFixed(2)}</strong> • Your Payable:{' '}
                          <strong className="text-blue-700 font-bold">${bill.patientPayable?.toFixed(2)}</strong>
                        </p>
                      </div>

                      {bill.status === 'PENDING' ? (
                        <Link to="/patient/bills">
                          <Button size="sm" className="text-xs h-8 px-3.5 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl">
                            Pay ${bill.patientPayable?.toFixed(2)}
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                          Paid
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Care Team Directory & Emergency Hotline */}
        <div className="lg:col-span-4 space-y-6">
          {/* Attending Specialists */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hospital Specialists</h3>
                <p className="text-[11px] text-slate-500">Board-certified doctors</p>
              </div>
              <Link to="/patient/book" className="text-[11px] font-bold text-blue-600 hover:underline">
                View all
              </Link>
            </div>

            <div className="p-4 space-y-2.5">
              {loadingDoctors ? (
                <div className="py-6 flex justify-center"><LoadingSpinner /></div>
              ) : doctors.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No specialists available.</p>
              ) : (
                doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        Dr
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                        <p className="text-[10px] text-blue-600 font-semibold truncate">
                          {doc.specialization || 'General Practice'}
                        </p>
                      </div>
                    </div>
                    <Link to="/patient/book" className="shrink-0">
                      <Button size="sm" variant="ghost" className="h-7 px-2.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 rounded-lg">
                        Book
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 24/7 Clinical Emergency Assistance */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-md space-y-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
                  <PhoneCall className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Emergency Triage
                  </h4>
                  <p className="text-[10px] text-cyan-300 font-mono">24/7 Active Hotline</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If experiencing chest pain, difficulty breathing, or severe trauma, call local emergency services immediately or visit Main CarePoint ER.
            </p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Direct ER:</span>
                <a
                  href="tel:8005552273"
                  className="text-xs font-extrabold text-cyan-300 hover:text-cyan-200 transition-colors"
                >
                  (800) 555-CARE
                </a>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                Toll Free
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
