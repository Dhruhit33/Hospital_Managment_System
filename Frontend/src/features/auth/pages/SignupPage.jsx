import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import {
  Activity,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { authApi } from '@/api/auth'
import { signupSchema } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { CarePointLogo } from '@/components/shared/CarePointLogo'

export function SignupPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [countdown, setCountdown] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      gender: 'Male',
      bloodGroup: 'O',
      password: '',
      confirmPassword: '',
      otp: '',
    },
  })

  const watchedEmail = watch('email')

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  // Reset OTP state if user modifies their email address
  useEffect(() => {
    if (otpSent) {
      setOtpSent(false)
      setOtpValue('')
    }
  }, [watchedEmail])

  const handleSendOtp = async () => {
    const isEmailValid = await trigger('email')
    if (!isEmailValid) {
      setServerError('Please enter a valid email address before requesting an OTP.')
      return
    }

    const email = watchedEmail?.trim()
    if (!email) {
      setServerError('Please enter your email address.')
      return
    }

    setOtpSending(true)
    setServerError('')
    try {
      await authApi.sendSignupOtp(email)
      setOtpSent(true)
      setCountdown(60)
      setSuccessMessage(`A 6-digit verification code has been dispatched to ${email}.`)
    } catch (err) {
      console.error('Failed to dispatch signup OTP:', err)
      const data = err.response?.data
      if (data?.message) {
        setServerError(data.message)
      } else {
        setServerError('Failed to dispatch OTP. Please check the email address and try again.')
      }
    } finally {
      setOtpSending(false)
    }
  }

  const onSubmit = async (data) => {
    setServerError('')
    setSuccessMessage('')

    // If OTP has not been sent yet, request OTP first
    if (!otpSent) {
      await handleSendOtp()
      return
    }

    const trimmedOtp = otpValue.trim()
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setServerError('Please enter the complete 6-digit verification code received in your email.')
      return
    }

    setIsLoading(true)
    try {
      const response = await authApi.signup({
        username: data.username.trim(),
        email: data.email.trim(),
        password: data.password,
        name: data.name.trim(),
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        otp: trimmedOtp,
      })
      setSuccessMessage(
        `Email verified and account registered for ${response.username}! Redirecting to login...`
      )
      setTimeout(() => {
        navigate('/login', { state: { prefillEmail: data.email } })
      }, 1500)
    } catch (err) {
      console.error('Registration failed:', err)
      const data = err.response?.data
      if (data?.fieldErrors?.length) {
        setServerError(
          data.fieldErrors.map((f) => `${f.field}: ${f.message}`).join(' | ')
        )
      } else if (data?.message) {
        if (data.code === 'DUPLICATE_RESOURCE' || data.message.includes('already exists')) {
          setServerError(`${data.message}. You can log in directly with this email.`)
        } else {
          setServerError(data.message)
        }
      } else if (err.code === 'ERR_NETWORK') {
        setServerError(
          'Network connection error: Unable to reach backend at http://localhost:8080. Please ensure your Spring Boot server is running.'
        )
      } else {
        setServerError(err.message || 'Failed to create patient account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Quick helper to fill a valid demo password matching all backend regex rules
  const fillSample = () => {
    setValue('password', 'Passw0rd123!', { shouldValidate: true })
    setValue('confirmPassword', 'Passw0rd123!', { shouldValidate: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center mb-5">
        <CarePointLogo size="xl" subtitle="Patient Registration" />
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-md border-border/80">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-xl font-bold text-center">Create Patient Account</CardTitle>
            <CardDescription className="text-center text-xs">
              Register to book doctor appointments and view medical records
            </CardDescription>
          </CardHeader>

          <CardContent>
            {serverError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{serverError}</div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="flex-1 font-medium">{successMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  Full Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. Dhurhit"
                    className="pl-9 text-sm"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] text-destructive font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-slate-700">
                  Username
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="e.g. dhruhit70"
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

              {/* Email Address */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                    Email Address
                  </Label>
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending || !watchedEmail}
                      className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      {otpSending ? (
                        <>
                          <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          Send Verification OTP
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Code Dispatched
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="dhruhitsavaliya70@gmail.com"
                    className="pl-9 text-sm"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-destructive font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Email Verification OTP Section */}
              {otpSent && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp" className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      Email Verification OTP
                    </Label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending || countdown > 0}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-60 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${otpSending ? 'animate-spin' : ''}`} />
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                    </button>
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="text-center font-mono tracking-widest text-base font-bold bg-white"
                  />
                  <p className="text-[10px] text-blue-700 leading-tight">
                    We sent a 6-digit code to <strong>{watchedEmail}</strong>. Check spam if not found in your inbox.
                  </p>
                </div>
              )}

              {/* Gender & Blood Group Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gender */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Gender
                  </Label>
                  <select
                    className="w-full h-9 px-3 rounded-md border border-input bg-card text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    {...register('gender')}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Blood Group
                  </Label>
                  <select
                    className="w-full h-9 px-3 rounded-md border border-input bg-card text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    {...register('bloodGroup')}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={fillSample}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Use sample valid password
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Passw0rd123!"
                    className="pl-9 pr-9 text-sm"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive font-medium">
                    {errors.password.message}
                  </p>
                )}
                <div className="text-[10px] text-muted-foreground bg-muted/40 p-2 rounded-md border border-border/50 space-y-0.5">
                  <span className="font-semibold block text-slate-700">Password requirements:</span>
                  <span>• 8-64 characters with 1 uppercase (A-Z) and 1 lowercase (a-z)</span>
                  <br />
                  <span>• 1 digit (0-9) and 1 special symbol: @ $ ! % * ? &amp;</span>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    className="pl-9 text-sm"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-destructive font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full mt-3 font-semibold shadow-xs" disabled={isLoading || otpSending}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying & Creating account...
                  </span>
                ) : otpSending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP to email...
                  </span>
                ) : !otpSent ? (
                  <span className="flex items-center justify-center gap-2">
                    Send OTP & Continue
                    <ArrowRight className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Verify Email & Create Account
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border/60 py-3 bg-slate-50/50 rounded-b-xl">
            <p className="text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
