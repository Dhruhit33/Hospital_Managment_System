import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CarePointLogo } from '@/components/shared/CarePointLogo'

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const jwt = searchParams.get('jwt')
    const userId = searchParams.get('userId')
    const refreshToken = searchParams.get('refreshToken')
    const error = searchParams.get('error')

    if (error) {
      setErrorMessage('Authentication failed or was cancelled. Please try again.')
      return
    }

    if (!jwt) {
      setErrorMessage('No authentication token received from identity provider.')
      return
    }

    let username = 'Patient User'
    let name = ''
    let roles = ['PATIENT']

    try {
      const parts = jwt.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (payload.sub) username = payload.sub
        if (payload.name) name = payload.name
        if (Array.isArray(payload.roles) && payload.roles.length > 0) {
          roles = payload.roles
        }
      }
    } catch (e) {
      console.warn('Could not decode OAuth JWT payload:', e)
    }

    const activeRole = roles.includes('ADMIN')
      ? 'ADMIN'
      : roles.includes('DOCTOR')
      ? 'DOCTOR'
      : 'PATIENT'

    setAuth({
      user: {
        id: userId ? Number(userId) : 1,
        email: username.includes('@') ? username : '',
        username: username,
        name: name || username.split('@')[0],
        roles: roles,
        activeRole: activeRole,
      },
      token: jwt,
      refreshToken: refreshToken || '',
    })

    const timer = setTimeout(() => {
      if (activeRole === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true })
      } else if (activeRole === 'DOCTOR') {
        navigate('/doctor/dashboard', { replace: true })
      } else {
        navigate('/patient/dashboard', { replace: true })
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [searchParams, setAuth, navigate])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <Card className="w-full max-w-md shadow-md border-border/80">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <CarePointLogo size="lg" iconOnly />
          </div>
          <CardTitle className="text-xl font-bold">
            {errorMessage ? 'Authentication Failed' : 'Authenticating...'}
          </CardTitle>
          <CardDescription className="text-xs">
            {errorMessage
              ? 'There was an issue processing your OAuth login'
              : 'Verifying credentials with provider & establishing secure session'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-center">
          {errorMessage ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <Link to="/login">
                <Button variant="outline" className="w-full text-xs">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-xs font-medium text-slate-600">
                Logged in successfully! Redirecting to Patient Portal...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
