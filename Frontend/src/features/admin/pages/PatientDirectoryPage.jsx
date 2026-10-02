import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Search, Filter, Droplet, Calendar, Mail, UserCheck } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function PatientDirectoryPage() {
  const [nameFilter, setNameFilter] = useState('')
  const [bloodGroupFilter, setBloodGroupFilter] = useState('')
  const [bornAfterFilter, setBornAfterFilter] = useState('')

  const { data: patientsData, isLoading } = useQuery({
    queryKey: ['admin-patients', nameFilter, bloodGroupFilter, bornAfterFilter],
    queryFn: () =>
      adminApi.getPatients({
        name: nameFilter || undefined,
        bloodGroup: bloodGroupFilter || undefined,
        bornAfter: bornAfterFilter || undefined,
        page: 0,
        size: 50,
      }),
  })

  const patients = patientsData?.content || []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Directory</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Search and inspect registered patient demographics, blood groups, and medical profiles.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by patient name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div>
              <select
                value={bloodGroupFilter}
                onChange={(e) => setBloodGroupFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-card text-xs font-medium"
              >
                <option value="">All Blood Groups</option>
                <option value="A">Blood Group A</option>
                <option value="B">Blood Group B</option>
                <option value="AB">Blood Group AB</option>
                <option value="O">Blood Group O</option>
              </select>
            </div>

            <div>
              <Input
                type="date"
                placeholder="Born After"
                value={bornAfterFilter}
                onChange={(e) => setBornAfterFilter(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Cards / Table */}
      {isLoading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner /></div>
      ) : patients.length === 0 ? (
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No patients found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search criteria or clearing filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p) => (
            <Card key={p.id} className="border-border/80 shadow-2xs hover:shadow-xs transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.name || 'Unnamed Patient'}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Patient ID: <span className="font-mono font-semibold">#{p.id}</span>
                    </p>
                  </div>
                  {p.bloodGroup && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Droplet className="w-3 h-3 text-rose-600" />
                      {p.bloodGroup}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-border/60 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{p.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Gender: <strong>{p.gender || 'Not specified'}</strong></span>
                    <span>DOB: <strong>{p.birthDate || 'N/A'}</strong></span>
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
