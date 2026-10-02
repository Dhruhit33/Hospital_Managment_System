import React from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, Stethoscope, CalendarCheck, Receipt } from 'lucide-react'

export function AdminDashboardPreview() {
  return (
    <div>
      <PageHeader
        title="Admin Control Center"
        description="Comprehensive overview of hospital operations, staff allocation, and patient intake."
      />

      {/* KPI Cards Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Total Doctors
            </CardTitle>
            <Stethoscope className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">24</div>
            <p className="text-xs text-muted-foreground mt-1">Across 6 specialized departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Registered Patients
            </CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1,482</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">+18 new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Today's Appointments
            </CardTitle>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">42</div>
            <p className="text-xs text-muted-foreground mt-1">36 booked, 6 pending confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Pending Invoices
            </CardTitle>
            <Receipt className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">15</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting patient insurance claim</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 text-sm text-slate-600">
        <h3 className="font-semibold text-slate-900 text-base mb-2">Step 1 UI Verification Active</h3>
        <p>
          You are viewing the shared layout with the persistent sidebar, top bar, and role badges.
          Navigation links are customized for the <strong>ADMIN</strong> portal.
        </p>
      </div>
    </div>
  )
}
