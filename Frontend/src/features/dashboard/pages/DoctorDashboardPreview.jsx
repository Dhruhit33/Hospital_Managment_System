import React from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle2, Users } from 'lucide-react'

export function DoctorDashboardPreview() {
  return (
    <div>
      <PageHeader
        title="Doctor Portal"
        description="Manage your clinical queue, scheduled visits, and patient consultations."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Today's Patients
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">8</div>
            <p className="text-xs text-muted-foreground mt-1">3 completed, 5 upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Next Consultation
            </CardTitle>
            <Clock className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">10:30 AM</div>
            <p className="text-xs text-muted-foreground mt-1">John Doe (Cardiology Review)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Schedule Status
            </CardTitle>
            <Calendar className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Active</div>
            <p className="text-xs text-muted-foreground mt-1">30 min slot duration configured</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 text-sm text-slate-600">
        <h3 className="font-semibold text-slate-900 text-base mb-2">Step 1 UI Verification Active</h3>
        <p>
          You are viewing the clinical doctor layout. Sidebar links are customized for the{' '}
          <strong>DOCTOR</strong> portal.
        </p>
      </div>
    </div>
  )
}
