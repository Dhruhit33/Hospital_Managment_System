import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  KeyRound,
  RotateCw,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import { loginSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { CarePointLogo } from '@/components/shared/CarePointLogo'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [serverError, setServerError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // 2FA OTP state
  const [otpStep, setOtpStep] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const completeLogin = (response, email) => {
    let inferredRoles = ['PATIENT']
    let decodedUsername = email
    let decodedName = response.name || ''

    if (response.jwt) {
      try {
        const parts = response.jwt.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          if (payload.sub) decodedUsername = payload.sub
          if (payload.name) decodedName = payload.name
          if (Array.isArray(payload.roles) && payload.roles.length > 0) {
            inferredRoles = payload.roles
          }
        }
      } catch (e) {
        console.warn('Could not decode token claims', e)
      }
    }

    const activeRole = inferredRoles.includes('ADMIN')
      ? 'ADMIN'
      : inferredRoles.includes('DOCTOR')
      ? 'DOCTOR'
      : 'PATIENT'

    setAuth({
      user: {
        id: response.userId,
        email: decodedUsername.includes('@') ? decodedUsername : email,
        username: decodedUsername,
        name: decodedName || response.username?.split('@')[0] || decodedUsername.split('@')[0],
        roles: inferredRoles,
        activeRole: activeRole,
      },
      token: response.jwt,
      refreshToken: response.refreshToken,
    })

    if (activeRole === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true })
    } else if (activeRole === 'DOCTOR') {
      navigate('/doctor/dashboard', { replace: true })
    } else {
      navigate('/patient/dashboard', { replace: true })
    }
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    setServerError('')
    setInfoMessage('')
    try {
      const response = await authApi.login(data)
      if (response.requiresOtp) {
        setOtpEmail(data.username.trim().toLowerCase())
        setOtpStep(true)
        setInfoMessage(response.message || `A 6-digit verification code has been dispatched to ${data.username}`)
        return
      }
      completeLogin(response, data.username)
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot reach backend at http://localhost:8080. Ensure Spring Boot is running.'
          : 'Invalid email or password. Please verify credentials.')
      setServerError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const onVerifyOtpSubmit = async (e) => {
    e.preventDefault()
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setServerError('Please enter a valid 6-digit verification code.')
      return
    }
    setIsLoading(true)
    setServerError('')
    try {
      const response = await authApi.verifyLoginOtp(otpEmail, otpCode.trim())
      completeLogin(response, otpEmail)
    } catch (err) {
      const data = err.response?.data
      if (data?.fieldErrors?.length) {
        setServerError(data.fieldErrors.map((f) => `${f.field}: ${f.message}`).join(' | '))
      } else if (data?.message) {
        setServerError(data.message)
      } else {
        setServerError('Invalid or expired verification code. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResending(true)
    setServerError('')
    try {
      await authApi.resendLoginOtp(otpEmail)
      setInfoMessage('A fresh verification code has been sent to ' + otpEmail)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to resend verification code.')
    } finally {
      setIsResending(false)
    }
  }

  const defaultUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const backendUrl = defaultUrl.includes('localhost') || defaultUrl.includes('10.95') ? `http://${window.location.hostname}:8080` : defaultUrl

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mb-5">
        <CarePointLogo size="xl" subtitle="Clinical Healthcare System" />
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-md border-border/80">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">
              {otpStep ? 'Two-Factor Verification' : 'Sign In'}
            </CardTitle>
            <CardDescription className="text-center text-xs">
              {otpStep
                ? `Enter the 6-digit code sent to ${otpEmail}`
                : 'Access your clinical dashboard and medical records'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {serverError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{serverError}</div>
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="flex-1">{infoMessage}</div>
              </div>
            )}

            {otpStep ? (
              <form onSubmit={onVerifyOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs font-semibold text-slate-700">
                    Enter 6-Digit Verification Code
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <KeyRound className="h-4 w-4 text-primary" />
                    </div>
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="pl-9 text-base tracking-widest text-center font-bold font-mono h-11"
                      autoFocus
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Check your email inbox or spam folder for the one-time code.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || otpCode.length !== 6}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying code...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Verify & Sign In
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(false)
                      setOtpCode('')
                      setServerError('')
                      setInfoMessage('')
                    }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-slate-900 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="flex items-center gap-1 text-primary hover:underline font-semibold disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                  {/* Username / Email field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-xs font-semibold text-slate-700">
                      Email / Username
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your email or username"
                        className="pl-9 text-sm"
                        {...register('username')}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-[11px] text-destructive font-medium">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Password field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                        Password
                      </Label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 text-sm"
                        {...register('password')}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-destructive font-medium">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Validating credentials...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>

                {/* OAuth Separator */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground text-[11px]">
                      Or sign in via OAuth
                    </span>
                  </div>
                </div>

                {/* OAuth Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`${backendUrl}/oauth2/authorization/google`}
                    className="flex items-center justify-center gap-2 h-9 px-3 border border-input rounded-md text-xs font-medium text-slate-700 hover:bg-secondary/80 transition-colors shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.22 0 10.05 0 12s.45 3.78 1.25 5.39l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                    Google
                  </a>

                  <a
                    href={`${backendUrl}/oauth2/authorization/github`}
                    className="flex items-center justify-center gap-2 h-9 px-3 border border-input rounded-md text-xs font-medium text-slate-700 hover:bg-secondary/80 transition-colors shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5 fill-current text-slate-900" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border/60 py-3 bg-slate-50/50 rounded-b-xl">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                Sign up as Patient
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
