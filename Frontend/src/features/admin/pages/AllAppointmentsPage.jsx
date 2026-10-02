import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  DollarSign,
  Trash2,
  Sparkles,
  Archive,
  ArrowRight,
  Filter,
  CheckCheck,
  ShieldAlert,
  Info,
  FileText,
  Download,
  Paperclip,
  X,
} from 'lucide-react'
import { doctorApi } from '@/api/doctor'
import { billingApi } from '@/api/billing'
import { appointmentsApi } from '@/api/appointments'
import { recordsApi } from '@/api/records'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function AllAppointmentsPage() {
  const queryClient = useQueryClient()
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [medicineCharges, setMedicineCharges] = useState('150.00')
  const [otherCharges, setOtherCharges] = useState('50.00')
  const [alert, setAlert] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('ALL')

  // Lab Report / Medical Record Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [selectedReportApt, setSelectedReportApt] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)

  // 1. Fetch appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['admin-all-appointments'],
    queryFn: async () => {
      try {
        const res = await appointmentsApi.getAllAppointments()
        return Array.isArray(res) ? res : []
      } catch (e) {
        try {
          const fallbackRes = await doctorApi.getDoctorAppointments()
          return Array.isArray(fallbackRes) ? fallbackRes : []
        } catch {
          return []
        }
      }
    },
  })

  // 2. Fetch all bills to correlate end-to-end lifecycle
  const { data: billsData, isLoading: loadingBills } = useQuery({
    queryKey: ['admin-bills'],
    queryFn: () => billingApi.getAdminBills({ size: 100 }),
  })

  const bills = billsData?.content || []

  // Helper to find bill for appointment
  const getBillForAppointment = (apt) => {
    if (!apt) return null
    const found = bills.find((b) => b.appointmentId === apt.id)
    if (found) return found
    if (apt.billId) {
      return {
        id: apt.billId,
        status: apt.billStatus,
        totalAmount: apt.billTotal,
        patientPayable: apt.patientPayable,
      }
    }
    return null
  }

  // Delete appointment mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => appointmentsApi.deleteAppointment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-bills'] })
      setAlert({
        type: 'success',
        text: `Visit record #${id} was archived and removed from the active system.`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove appointment.',
      })
    },
  })

  // Bulk Cleanup mutation for completed and settled appointments
  const cleanupMutation = useMutation({
    mutationFn: () => appointmentsApi.cleanupCompletedAppointments(0),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-bills'] })
      setAlert({
        type: 'success',
        text: res.message || `Purged ${res.deletedCount || 0} completed and settled appointments.`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Cleanup operation failed.',
      })
    },
  })

  // Quick Mark as Paid mutation
  const markPaidMutation = useMutation({
    mutationFn: (billId) => billingApi.updateBillStatus(billId, 'PAID'),
    onSuccess: (_, billId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-bills'] })
      setAlert({
        type: 'success',
        text: `Invoice #${billId} marked as PAID. All end-to-end processes cleared!`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update invoice status.',
      })
    },
  })

  // Quick Confirm Appointment Mutation (Admin)
  const confirmAppointmentMutation = useMutation({
    mutationFn: (id) => appointmentsApi.updateStatus(id, 'CONFIRMED'),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-appointments'] })
      setAlert({
        type: 'success',
        text: `Appointment #${id} confirmed! Confirmation email dispatched to the patient.`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to confirm appointment.',
      })
    },
  })

  // Bill Generation Mutation
  const generateBillMutation = useMutation({
    mutationFn: ({ appointmentId, payload }) =>
      billingApi.generateBill(appointmentId, payload),
    onSuccess: (newBill) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-bills'] })
      setGenerateModalOpen(false)
      setAlert({
        type: 'success',
        text: `Invoice #${newBill.id} issued successfully for Visit #${newBill.appointmentId}. Total: $${newBill.totalAmount?.toFixed(2)}`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to generate bill.',
      })
    },
  })

  const handleOpenGenerate = (apt) => {
    setSelectedAppointment(apt)
    setMedicineCharges('150.00')
    setOtherCharges('50.00')
    setGenerateModalOpen(true)
    setAlert({ type: '', text: '' })
  }

  const handleGenerateSubmit = (e) => {
    e.preventDefault()
    if (!selectedAppointment) return
    generateBillMutation.mutate({
      appointmentId: selectedAppointment.id,
      payload: {
        medicineCharges: Number(medicineCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
      },
    })
  }

  // Delete Medical Record Mutation (Admin)
  const deleteRecordMutation = useMutation({
    mutationFn: (recordId) => recordsApi.deleteAdminRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-records'] })
      setReportModalOpen(false)
      setReportData(null)
      setAlert({
        type: 'success',
        text: 'Medical record and diagnostic report removed from the system.',
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete medical record.',
      })
    },
  })

  const handleOpenReportModal = async (apt) => {
    setSelectedReportApt(apt)
    setReportModalOpen(true)
    setLoadingReport(true)
    try {
      const res = await recordsApi.getRecordByAppointmentId(apt.id)
      setReportData(res)
    } catch (e) {
      // Fallback check in patient local storage
      const patientId = apt.patient?.id || apt.patientId
      const stored = JSON.parse(localStorage.getItem(`carepoint_records_${patientId}`) || '[]')
      const matched = stored.find((r) => r.appointmentId === apt.id)
      if (matched) {
        setReportData(matched)
      } else {
        setReportData({
          appointmentId: apt.id,
          diagnosis: apt.reason || 'General Consultation',
          notes: 'No specific EHR notes recorded.',
          doctorName: apt.doctor?.name,
          createdAt: apt.appointmentDate,
        })
      }
    } finally {
      setLoadingReport(false)
    }
  }

  const handleDownloadReport = (data) => {
    if (data.attachmentData) {
      const link = document.createElement('a')
      link.href = data.attachmentData
      link.download = data.attachmentName || `Diagnostic_Report_${data.id || data.appointmentId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(`
        <html>
          <head>
            <title>Diagnostic Report #${data.id || data.appointmentId}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
              .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
              .title { font-size: 20px; font-weight: bold; color: #1e3a8a; }
              .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; font-size: 13px; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">CAREPOINT CLINICAL CONSULTATION REPORT</div>
              <div style="font-size: 12px; color: #64748b;">Official Electronic Health Record • Appointment #${data.appointmentId || data.id}</div>
            </div>
            <div class="box">
              <strong>Patient Name:</strong> ${data.patientName || selectedReportApt?.patient?.name || 'Patient'}<br>
              <strong>Attending Doctor:</strong> ${data.doctorName || selectedReportApt?.doctor?.name || 'Doctor'}<br>
              <strong>Diagnosis:</strong> ${data.diagnosis || 'Clinical Follow-up'}<br>
              <strong>Notes:</strong> ${data.notes || 'None'}<br>
              <strong>Date:</strong> ${data.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `)
      win.document.close()
    }
  }

  // Filter appointments according to active lifecycle tab
  const filteredAppointments = appointments.filter((apt) => {
    const bill = getBillForAppointment(apt)
    if (activeTab === 'ALL') return true
    if (activeTab === 'IN_PROGRESS') return apt.status === 'BOOKED' || apt.status === 'CONFIRMED'
    if (activeTab === 'NEEDS_INVOICE') return apt.status === 'COMPLETED' && !bill
    if (activeTab === 'PENDING_PAYMENT') return apt.status === 'COMPLETED' && bill?.status === 'PENDING'
    if (activeTab === 'SETTLED') return apt.status === 'COMPLETED' && bill?.status === 'PAID'
    if (activeTab === 'CANCELLED') return apt.status === 'CANCELLED'
    return true
  })

  // Count how many visits have their end-to-end lifecycle settled and cleared
  const settledCount = appointments.filter((apt) => {
    const bill = getBillForAppointment(apt)
    return apt.status === 'COMPLETED' && bill?.status === 'PAID'
  }).length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Visits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review end-to-end consultation progress, clinical invoices, settlement lifecycle, and automated archiving.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {settledCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
              className="text-xs gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100/70"
            >
              <Archive className="w-3.5 h-3.5" />
              {cleanupMutation.isPending ? 'Clearing...' : `Clear Settled Visits (${settledCount})`}
            </Button>
          )}

          <Link to="/admin/billing">
            <Button size="sm" variant="outline" className="text-xs gap-1.5">
              <Receipt className="w-3.5 h-3.5" />
              Billing Console
            </Button>
          </Link>
        </div>
      </div>

      {/* Automated Retention & Lifecycle Policy Banner */}
      <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/60 text-blue-900 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-semibold block">Automated Archiving & Removal Policy:</strong>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Appointments that are confirmed, completed, and have their end-to-end invoice cleared (status: <strong>PAID</strong>) are automatically purged by the hospital cleanup scheduler after the 7-day retention period. You can also archive or remove settled visits immediately using the <strong>"Archive / Remove Now"</strong> action.
          </p>
        </div>
      </div>

      {/* Alert Notifications */}
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
          <button onClick={() => setAlert({ type: '', text: '' })} className="hover:opacity-75">✕</button>
        </div>
      )}

      {/* Lifecycle Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3">
        {[
          { key: 'ALL', label: 'All Visits', count: appointments.length },
          { key: 'IN_PROGRESS', label: 'In Progress', count: appointments.filter((a) => a.status === 'BOOKED' || a.status === 'CONFIRMED').length },
          { key: 'NEEDS_INVOICE', label: 'Needs Invoice', count: appointments.filter((a) => a.status === 'COMPLETED' && !getBillForAppointment(a)).length },
          { key: 'PENDING_PAYMENT', label: 'Payment Pending', count: appointments.filter((a) => a.status === 'COMPLETED' && getBillForAppointment(a)?.status === 'PENDING').length },
          { key: 'SETTLED', label: 'Cleared & Settled', count: settledCount },
          { key: 'CANCELLED', label: 'Cancelled', count: appointments.filter((a) => a.status === 'CANCELLED').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground shadow-2xs'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.key
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loadingAppointments || loadingBills ? (
        <div className="py-16 flex justify-center"><LoadingSpinner /></div>
      ) : filteredAppointments.length === 0 ? (
        <Card className="border-border/80 shadow-2xs border-dashed">
          <CardContent className="py-16 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No visits in this category</h3>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'SETTLED'
                ? 'No completed appointments currently have their invoices fully paid and settled.'
                : 'Bookings scheduled by patients will be tracked here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((apt) => {
            const bill = getBillForAppointment(apt)
            const isSettled = apt.status === 'COMPLETED' && bill?.status === 'PAID'
            const isPendingBill = apt.status === 'COMPLETED' && bill?.status === 'PENDING'
            const needsInvoice = apt.status === 'COMPLETED' && !bill

            return (
              <Card
                key={apt.id}
                className={`border transition-all shadow-2xs ${
                  isSettled
                    ? 'border-emerald-200 bg-emerald-50/15'
                    : isPendingBill
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-border/80'
                }`}
              >
                <CardContent className="p-5 space-y-3">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          Appointment #{apt.id}
                        </h3>
                        {isSettled && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            End-to-End Cleared
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        Doctor: {apt.doctor?.name || 'Assigned Physician'} ({apt.doctor?.specialization || 'General'})
                      </p>
                      <p className="text-xs font-semibold text-primary mt-0.5">
                        Patient: {apt.patient?.name || apt.patient?.user?.username || 'Registered Patient'}
                      </p>
                    </div>

                    <StatusBadge status={apt.status} />
                  </div>

                  {/* Date and Time Details */}
                  <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>
                        {apt.appointmentTime
                          ? new Date(apt.appointmentTime).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Reason: {apt.reason || 'General consultation'}
                    </p>
                  </div>

                  {/* End-to-End Lifecycle & Invoice Status Section */}
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    {/* Invoice Status Pill */}
                    {bill ? (
                      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30 border border-border/60">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold text-slate-800">
                            Invoice #{bill.id}: ${Number(bill.totalAmount || 0).toFixed(2)}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            bill.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </div>
                    ) : apt.status === 'COMPLETED' ? (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/80 flex items-center justify-between">
                        <span>Clinical consultation completed • Invoice pending</span>
                      </div>
                    ) : null}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                      {apt.status === 'CANCELLED' ? (
                        <>
                          <span className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-rose-500" />
                            Cancelled • Auto-purged after 24h
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 ml-auto"
                            onClick={() => deleteMutation.mutate(apt.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            Delete
                          </Button>
                        </>
                      ) : isSettled ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5 font-semibold"
                            onClick={() => handleOpenReportModal(apt)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            EHR & Report
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1.5 text-slate-700 border-border hover:bg-muted ml-auto"
                            onClick={() => deleteMutation.mutate(apt.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Archive className="w-3.5 h-3.5 text-slate-500" />
                            Archive
                          </Button>
                        </>
                      ) : isPendingBill ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5 font-semibold"
                            onClick={() => handleOpenReportModal(apt)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            EHR & Report
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold"
                            onClick={() => markPaidMutation.mutate(bill.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Mark as Paid
                          </Button>
                          <Link to="/admin/billing" className="ml-auto">
                            <Button size="sm" variant="ghost" className="text-xs h-8 gap-1 text-primary">
                              Billing <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </>
                      ) : needsInvoice ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5 font-semibold"
                            onClick={() => handleOpenReportModal(apt)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            EHR & Report
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-8 gap-1.5 font-semibold ml-auto bg-primary hover:bg-primary/90"
                            onClick={() => handleOpenGenerate(apt)}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Generate Invoice
                          </Button>
                        </>
                      ) : apt.status === 'COMPLETED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1.5 text-primary border-primary/30 hover:bg-primary/5 font-semibold"
                          onClick={() => handleOpenReportModal(apt)}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          EHR & Report
                        </Button>
                      ) : apt.status === 'BOOKED' ? (
                        <div className="flex items-center justify-between w-full flex-wrap gap-2">
                          <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md font-medium flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Booked • Awaiting Confirmation
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1.5 text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 font-semibold ml-auto"
                            onClick={() => confirmAppointmentMutation.mutate(apt.id)}
                            disabled={confirmAppointmentMutation.isPending}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Confirm & Send Email
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md font-medium">
                            Visit {apt.status.toLowerCase()} • Clinical care active
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Generate Bill Modal */}
      {generateModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Generate Bill — Visit #{selectedAppointment.id}
              </CardTitle>
              <CardDescription className="text-xs">
                Doctor: {selectedAppointment.doctor?.name} ({selectedAppointment.doctor?.specialization || 'Cardiology'})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleGenerateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="medCharges" className="text-xs font-semibold text-slate-700">
                    Medicine / Pharmacy Charges ($) *
                  </Label>
                  <Input
                    id="medCharges"
                    type="number"
                    step="0.01"
                    min="0"
                    value={medicineCharges}
                    onChange={(e) => setMedicineCharges(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="otherCharges" className="text-xs font-semibold text-slate-700">
                    Lab Tests & Other Charges ($) *
                  </Label>
                  <Input
                    id="otherCharges"
                    type="number"
                    step="0.01"
                    min="0"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60">
                  Doctor consultation fee and insurance coverage percentage will be automatically applied by the backend billing calculator.
                </p>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setGenerateModalOpen(false)}
                    disabled={generateBillMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={generateBillMutation.isPending}>
                    {generateBillMutation.isPending ? 'Generating...' : 'Issue Invoice'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EHR & Lab Report Audit / Download / Delete Modal */}
      {reportModalOpen && selectedReportApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl border border-border p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    EHR & Clinical Diagnostic Report
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Visit Ref #{selectedReportApt.id} • Patient #{selectedReportApt.patient?.id || selectedReportApt.patientId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReportModalOpen(false)
                  setReportData(null)
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingReport ? (
              <div className="py-12 flex justify-center"><LoadingSpinner /></div>
            ) : reportData ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/30 rounded-xl border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Patient</span>
                    <strong className="text-slate-900 block text-xs">
                      {selectedReportApt.patient?.name || reportData.patientName || `Patient #${selectedReportApt.patientId}`}
                    </strong>
                    <span className="text-[11px] text-slate-500">CarePoint ID #{selectedReportApt.patientId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Attending Physician</span>
                    <strong className="text-slate-900 block text-xs">
                      {reportData.doctorName || selectedReportApt.doctor?.name || 'Physician'}
                    </strong>
                    <span className="text-[11px] text-slate-500">{selectedReportApt.doctor?.specialization || 'Clinical Medicine'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider block">
                    Clinical Diagnosis / Condition
                  </span>
                  <div className="p-3 bg-card rounded-lg border border-border font-semibold text-slate-900">
                    {reportData.diagnosis || 'Clinical follow-up'}
                  </div>
                </div>

                {reportData.notes && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider block">
                      Physician Observations & Treatment Summary
                    </span>
                    <div className="p-3 bg-card rounded-lg border border-border text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {reportData.notes}
                    </div>
                  </div>
                )}

                {/* Prescriptions list if available */}
                {reportData.prescriptions && reportData.prescriptions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider block">
                      Prescribed Medications ({reportData.prescriptions.length})
                    </span>
                    <div className="space-y-1.5">
                      {reportData.prescriptions.map((p, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-border/80 flex justify-between items-center text-[11px]">
                          <div>
                            <strong className="text-slate-900">{p.medicineName}</strong>
                            <span className="text-muted-foreground ml-2">({p.frequency || 'Daily'})</span>
                          </div>
                          <span className="font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded">
                            {p.dosage || 'Standard'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attached Lab Report Document */}
                {reportData.attachmentName ? (
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <strong className="text-slate-900 text-xs block">{reportData.attachmentName}</strong>
                        <span className="text-[10px] text-emerald-700">
                          {reportData.attachmentSize || 'Electronic Document'} • Verified Diagnostic Attachment
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadReport(reportData)}
                      className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-7"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between text-muted-foreground">
                    <span>No separate file attached to this consultation.</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadReport(reportData)}
                      className="text-xs gap-1 text-primary h-7"
                    >
                      <Download className="w-3 h-3" />
                      Download Summary
                    </Button>
                  </div>
                )}

                {/* Modal Footer with Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to permanently delete this Medical Record & Report?')) {
                        deleteRecordMutation.mutate(reportData.id || selectedReportApt.id)
                      }
                    }}
                    disabled={deleteRecordMutation.isPending}
                    className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Record
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(reportData)}
                      className="text-xs gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export / Print
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setReportModalOpen(false)
                        setReportData(null)
                      }}
                      className="text-xs"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No clinical records on file for this appointment.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
