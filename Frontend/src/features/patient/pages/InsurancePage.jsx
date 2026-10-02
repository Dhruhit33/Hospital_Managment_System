import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldCheck,
  Building,
  Calendar,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import { insuranceApi } from '@/api/insurance'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function InsurancePage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [policyNumber, setPolicyNumber] = useState('')
  const [provider, setProvider] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [coveragePercent, setCoveragePercent] = useState('70')
  const [alert, setAlert] = useState({ type: '', text: '' })

  const { data: insurance, isLoading, isError } = useQuery({
    queryKey: ['patient-insurance'],
    queryFn: () => insuranceApi.getInsurance(),
    retry: false,
  })

  // Add / Update insurance mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => insuranceApi.addInsurance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-insurance'] })
      setFormOpen(false)
      setAlert({ type: 'success', text: 'Insurance policy linked to your patient profile.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save insurance details.',
      })
    },
  })

  // Delete insurance mutation
  const deleteMutation = useMutation({
    mutationFn: () => insuranceApi.deleteInsurance(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-insurance'] })
      setAlert({ type: 'success', text: 'Insurance policy removed from your profile.' })
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete insurance.',
      })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!policyNumber.trim() || !provider.trim()) {
      setAlert({ type: 'error', text: 'Policy number and insurance provider are required.' })
      return
    }

    saveMutation.mutate({
      policyNumber,
      provider,
      validUntil: validUntil || undefined,
      coveragePercent: coveragePercent ? Number(coveragePercent) : 50,
    })
  }

  const hasInsurance = insurance && !isError && insurance.policyNumber

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Health Insurance</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Link and manage your health coverage policy for automatic deductions on hospital bills.
          </p>
        </div>

        {!hasInsurance && !formOpen && (
          <Button
            size="sm"
            onClick={() => {
              setFormOpen(true)
              setAlert({ type: '', text: '' })
            }}
            className="gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Link Policy
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
        </div>
      )}

      {isLoading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner /></div>
      ) : hasInsurance ? (
        <div className="space-y-6">
          {/* Active Policy Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200 block">
                  Active Healthcare Policy
                </span>
                <h3 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
                  {insurance.provider}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-300" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-emerald-700/60 pt-6 text-xs">
              <div>
                <span className="text-[11px] text-emerald-300 block">Policy ID</span>
                <span className="font-mono font-semibold text-sm">{insurance.policyNumber}</span>
              </div>
              <div>
                <span className="text-[11px] text-emerald-300 block">Coverage Ratio</span>
                <span className="font-bold text-sm">{insurance.coveragePercent}%</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] text-emerald-300 block">Valid Until</span>
                <span className="font-semibold text-sm">
                  {insurance.validUntil || 'Lifetime Coverage'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPolicyNumber(insurance.policyNumber || '')
                setProvider(insurance.provider || '')
                setValidUntil(insurance.validUntil || '')
                setCoveragePercent(String(insurance.coveragePercent || 70))
                setFormOpen(true)
              }}
              className="text-xs"
            >
              Update Details
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="text-xs gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleteMutation.isPending ? 'Removing...' : 'Remove Policy'}
            </Button>
          </div>
        </div>
      ) : (
        !formOpen && (
          <Card className="border-border/80 shadow-2xs">
            <CardContent className="py-16 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800">No insurance policy linked</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Adding your insurance provider allows the billing team to automatically apply deductions to hospital and pharmacy bills.
                </p>
              </div>
              <Button size="sm" onClick={() => setFormOpen(true)} className="gap-2 mt-2">
                <Plus className="w-4 h-4" />
                Link Insurance Now
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Link / Edit Policy Form */}
      {formOpen && (
        <Card className="border-border/80 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900">
              {hasInsurance ? 'Update Insurance Details' : 'Link Healthcare Insurance'}
            </CardTitle>
            <CardDescription className="text-xs">
              Provide official insurer credentials and validity terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="provider" className="text-xs font-semibold text-slate-700">
                    Insurance Provider
                  </Label>
                  <Input
                    id="provider"
                    placeholder="e.g. Star Health, BlueCross, Aetna"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="policyNumber" className="text-xs font-semibold text-slate-700">
                    Policy Number
                  </Label>
                  <Input
                    id="policyNumber"
                    placeholder="e.g. POL-99231"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="coveragePercent" className="text-xs font-semibold text-slate-700">
                    Coverage Percentage (%)
                  </Label>
                  <Input
                    id="coveragePercent"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 70"
                    value={coveragePercent}
                    onChange={(e) => setCoveragePercent(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="validUntil" className="text-xs font-semibold text-slate-700">
                    Policy Expiry Date
                  </Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormOpen(false)}
                  disabled={saveMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Insurance Policy'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
