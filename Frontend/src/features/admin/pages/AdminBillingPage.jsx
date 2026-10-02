import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Receipt,
  Search,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react'
import { billingApi } from '@/api/billing'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function AdminBillingPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')
  const [alert, setAlert] = useState({ type: '', text: '' })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => billingApi.updateBillStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-bills'] })
      setAlert({
        type: 'success',
        text: `Invoice #${variables.id} status successfully changed to ${variables.status} by Admin.`,
      })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update invoice status.',
      })
    },
  })

  const { data: billsData, isLoading } = useQuery({
    queryKey: ['admin-bills', statusFilter, fromFilter, toFilter],
    queryFn: () =>
      billingApi.getAdminBills({
        status: statusFilter || undefined,
        from: fromFilter ? `${fromFilter}T00:00:00` : undefined,
        to: toFilter ? `${toFilter}T23:59:59` : undefined,
        page: 0,
        size: 50,
      }),
  })

  const bills = billsData?.content || []

  const totalRevenue = bills
    .filter((b) => b.status === 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0)

  const pendingAmount = bills
    .filter((b) => b.status === 'PENDING')
    .reduce((sum, b) => sum + (b.patientPayable || 0), 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Invoices</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Audit patient billing records, track payments, and review insurance deductions.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-emerald-700 block text-[10px] font-semibold uppercase">Total Settled</span>
            <strong className="text-emerald-900 text-sm">${totalRevenue.toFixed(2)}</strong>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-amber-700 block text-[10px] font-semibold uppercase">Pending Collection</span>
            <strong className="text-amber-900 text-sm">${pendingAmount.toFixed(2)}</strong>
          </div>
        </div>
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

      {/* Filter Bar */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-xs font-medium"
              >
                <option value="">All Invoice Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <Input
                type="date"
                placeholder="From Date"
                value={fromFilter}
                onChange={(e) => setFromFilter(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <Input
                type="date"
                placeholder="To Date"
                value={toFilter}
                onChange={(e) => setToFilter(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Cards */}
      {isLoading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner /></div>
      ) : bills.length === 0 ? (
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="py-16 text-center space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No invoices found</h3>
            <p className="text-xs text-muted-foreground">
              Try changing or resetting your search filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bills.map((bill) => (
            <Card key={bill.id} className="border-border/80 shadow-2xs">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Invoice #{bill.id}</h3>
                      <StatusBadge status={bill.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Appointment ID #{bill.appointmentId} • {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block uppercase">Total Amount</span>
                    <strong className="text-base font-bold text-slate-900">
                      ${bill.totalAmount?.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span>Consultation:</span>
                    <span>${bill.consultationFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medications:</span>
                    <span>${bill.medicineCharges?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tests/Other:</span>
                    <span>${bill.otherCharges?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-border/50">
                    <span>Insurance Covered:</span>
                    <span>-${bill.insuranceCovered?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-border/60">
                    <span>Patient Payable:</span>
                    <span>${bill.patientPayable?.toFixed(2)}</span>
                  </div>
                </div>

                {bill.payments && bill.payments.length > 0 && (
                  <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/70 text-[11px] space-y-1 text-emerald-800">
                    <span className="font-semibold block">Settlement Record:</span>
                    {bill.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px]">
                        <span>Ref: {p.transactionRef} ({p.method})</span>
                        <span className="font-bold">${p.amount?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Admin Status Actions */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin Action
                  </span>

                  <div className="flex gap-2">
                    {bill.status === 'PENDING' && (
                      <Button
                        size="sm"
                        className="text-xs h-7 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        onClick={() => updateStatusMutation.mutate({ id: bill.id, status: 'PAID' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark as Paid
                      </Button>
                    )}

                    {bill.status === 'PAID' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50 font-medium"
                        onClick={() => updateStatusMutation.mutate({ id: bill.id, status: 'PENDING' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Revert to Pending
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
