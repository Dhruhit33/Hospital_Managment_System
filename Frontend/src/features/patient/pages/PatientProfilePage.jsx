import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  Droplet,
  Calendar,
  Save,
  AlertCircle,
  HeartPulse,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { patientApi } from '@/api/patient'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export function PatientProfilePage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const token = useAuthStore((state) => state.token)
  const refreshToken = useAuthStore((state) => state.refreshToken)

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    bloodGroup: 'O',
    birthDate: '',
  })
  const [alert, setAlert] = useState({ type: '', text: '' })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => {
      const res = await patientApi.getProfile()
      return res
    },
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        gender: profile.gender || 'Male',
        bloodGroup: profile.bloodGroup || 'O',
        birthDate: profile.birthDate || '',
      })
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: (data) => patientApi.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] })
      setAlert({ type: 'success', text: 'Patient health profile updated successfully!' })

      // Also update authStore user name if changed
      if (user && updated.name && user.name !== updated.name) {
        setAuth({
          user: { ...user, name: updated.name },
          token,
          refreshToken,
        })
      }
    },
    onError: (err) => {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile. Please verify fields.',
      })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setAlert({ type: '', text: '' })

    const payload = {
      name: formData.name.trim(),
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      birthDate: formData.birthDate || null,
    }

    updateMutation.mutate(payload)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Personal Health Profile</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your personal medical identity, gender, blood group, and account credentials.
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

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {profile?.name || user?.name || user?.username || 'Verified Patient'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Patient Account #{user?.id || profile?.id || '---'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Account Overview Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    Registered Email (Username)
                  </span>
                  <p className="font-semibold text-slate-900 truncate">
                    {profile?.email || user?.username || 'user@carepoint.com'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Shield className="w-3.5 h-3.5" />
                    Active Access Role
                  </span>
                  <div>
                    <StatusBadge status={user?.activeRole || 'PATIENT'} />
                  </div>
                </div>
              </div>

              {/* Editable Fields Section */}
              <div className="pt-2 border-t border-border/60 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-primary" />
                  Medical & Personal Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="text-xs"
                      required
                    />
                  </div>

                  {/* Gender Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs font-semibold text-slate-700">
                      Gender
                    </Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-card text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Blood Group Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bloodGroup" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-500" />
                      Blood Group
                    </Label>
                    <select
                      id="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-input bg-card text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>

                  {/* Birth Date */}
                  <div className="space-y-1.5">
                    <Label htmlFor="birthDate" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Date of Birth
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex justify-end">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="gap-2 text-xs font-semibold shadow-xs"
                >
                  {updateMutation.isPending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Health Profile
                    </>
                  )}
                </Button>
              </div>

              {/* Security info banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 mt-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold">Security & Privacy Active</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    JWT bearer session and single-use rotating refresh tokens are securing your medical records.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}
