import React from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Calendar, CreditCard, ShieldCheck, HeartPulse } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PatientDashboardPreview() {
  return (
    <div>
      <PageHeader
        title="Patient Care Portal"
        description="View your upcoming doctor appointments, lab records, and medical billing."
      >
        <Button className="gap-2">
          <Calendar className="w-4 h-4" />
          Book Appointment
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Upcoming Visit
            </CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">Dr. Robert Smith</div>
            <p className="text-xs text-muted-foreground mt-1">Oct 25, 2026 at 10:30 AM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Insurance Status
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-600">Covered (80%)</div>
            <p className="text-xs text-muted-foreground mt-1">CareHealth Global Policy #9876</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Pending Bills
            </CardTitle>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900">$200.00</div>
            <p className="text-xs text-amber-600 font-medium mt-1">1 bill awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 text-sm text-slate-600">
        <h3 className="font-semibold text-slate-900 text-base mb-2">Step 1 UI Verification Active</h3>
        <p>
          You are viewing the patient self-service workspace. Sidebar links are customized for the{' '}
          <strong>PATIENT</strong> portal.
        </p>
      </div>
    </div>
  )
}
