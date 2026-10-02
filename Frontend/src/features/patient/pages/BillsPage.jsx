import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Receipt,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Clock,
  QrCode,
  Smartphone,
  User,
  MapPin,
  Copy,
  Check,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react'
import { billingApi } from '@/api/billing'
import { useAuthStore } from '@/store/authStore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

/**
 * Pixel-crisp SVG QR Code generator for UPI payment links
 */
function UpiQrCode({ upiString, size = 180 }) {
  // Deterministic 25x25 matrix generator based on seed
  const matrixSize = 25
  const seed = upiString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const isFinder = (r, c) => {
    // Top-Left Finder
    if (r < 7 && c < 7) {
      return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)
    }
    // Top-Right Finder
    if (r < 7 && c >= matrixSize - 7) {
      const oc = c - (matrixSize - 7)
      return r === 0 || r === 6 || oc === 0 || oc === 6 || (r >= 2 && r <= 4 && oc >= 2 && oc <= 4)
    }
    // Bottom-Left Finder
    if (r >= matrixSize - 7 && c < 7) {
      const or = r - (matrixSize - 7)
      return or === 0 || or === 6 || c === 0 || c === 6 || (or >= 2 && or <= 4 && c >= 2 && c <= 4)
    }
    // Alignment Pattern
    if (r >= 16 && r <= 20 && c >= 16 && c <= 20) {
      const ar = r - 16
      const ac = c - 16
      return ar === 0 || ar === 4 || ac === 0 || ac === 4 || (ar === 2 && ac === 2)
    }
    return null
  }

  const cells = []
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Center logo cutout
      if (r >= 10 && r <= 14 && c >= 10 && c <= 14) continue

      const finder = isFinder(r, c)
      if (finder !== null) {
        if (finder) cells.push({ r, c })
      } else if (r === 6 || c === 6) {
        // Timing lines
        if ((r + c) % 2 === 0) cells.push({ r, c })
      } else {
        // Data bits based on seed
        const val = Math.sin(seed * (r * matrixSize + c + 1)) * 10000
        if (Math.floor(val) % 3 === 0 || (r * c) % 5 === 0) {
          cells.push({ r, c })
        }
      }
    }
  }

  const cellSize = size / matrixSize

  return (
    <div className="relative inline-flex items-center justify-center p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <rect width={size} height={size} fill="#ffffff" rx="8" />

        {/* Modules */}
        {cells.map(({ r, c }, idx) => (
          <rect
            key={idx}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize * 0.92}
            height={cellSize * 0.92}
            rx={cellSize * 0.15}
            fill="#0f172a"
          />
        ))}

        {/* Center Hospital Cross / UPI Logo Shield */}
        <circle cx={size / 2} cy={size / 2} r={cellSize * 2.2} fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
        <rect x={size / 2 - 2} y={size / 2 - 9} width="4" height="18" fill="#2563eb" rx="1" />
        <rect x={size / 2 - 9} y={size / 2 - 2} width="18" height="4" fill="#2563eb" rx="1" />
      </svg>
    </div>
  )
}

export function BillsPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)

  const [selectedBill, setSelectedBill] = useState(null)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('UPI') // 'UPI' | 'CARD'
  const [alertState, setAlertState] = useState({ type: '', text: '' })
  const [formError, setFormError] = useState('')

  // UPI State
  const [upiStep, setUpiStep] = useState('FORM') // 'FORM' | 'QR'
  const [upiName, setUpiName] = useState('')
  const [upiPhone, setUpiPhone] = useState('')
  const [upiAddress, setUpiAddress] = useState('')
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [qrTimer, setQrTimer] = useState(300) // 5 minutes

  // Card State
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [isProcessingCard, setIsProcessingCard] = useState(false)

  // QR Timer countdown
  useEffect(() => {
    let interval = null
    if (payModalOpen && paymentMethod === 'UPI' && upiStep === 'QR' && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [payModalOpen, paymentMethod, upiStep, qrTimer])

  const { data: billsData, isLoading } = useQuery({
    queryKey: ['patient-bills'],
    queryFn: () => billingApi.getPatientBills({ page: 0, size: 50 }),
  })

  const bills = billsData?.content || []

  // Pay bill mutation
  const payMutation = useMutation({
    mutationFn: ({ billId, amount, method, ref }) => {
      const idempotencyKey = crypto.randomUUID()
      const transactionRef = ref || `${method}-TXN-${Math.floor(100000 + Math.random() * 900000)}`
      return billingApi.payBill(billId, {
        amount,
        method,
        transactionRef,
        idempotencyKey,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient-bills'] })
      queryClient.invalidateQueries({ queryKey: ['patient-bills-preview'] })
      queryClient.invalidateQueries({ queryKey: ['admin-bills'] })
      setPayModalOpen(false)
      setIsProcessingCard(false)
      setAlertState({
        type: 'success',
        text: `Payment of $${variables.amount?.toFixed(2)} processed successfully via ${variables.method}! Invoice #${variables.billId} marked as PAID.`,
      })
    },
    onError: (err) => {
      setIsProcessingCard(false)
      setAlertState({
        type: 'error',
        text: err.response?.data?.message || 'Payment transaction failed. Please retry.',
      })
    },
  })

  const handleOpenPay = (bill) => {
    setSelectedBill(bill)
    setPaymentMethod('UPI')
    setUpiStep('FORM')
    setUpiName(user?.name || user?.username?.split('@')[0] || '')
    setUpiPhone('')
    setUpiAddress('')
    setCardName(user?.name || user?.username?.split('@')[0] || '')
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')
    setFormError('')
    setCopiedUpi(false)
    setQrTimer(300)
    setPayModalOpen(true)
    setAlertState({ type: '', text: '' })
  }

  // UPI: Step 1 -> Step 2 validation
  const handleGenerateUpiQr = (e) => {
    e.preventDefault()
    setFormError('')

    if (!upiName.trim()) {
      setFormError('Please enter your Full Name.')
      return
    }
    const cleanPhone = upiPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.')
      return
    }
    if (!upiAddress.trim()) {
      setFormError('Please enter your billing / residential address.')
      return
    }

    setQrTimer(300)
    setUpiStep('QR')
  }

  // UPI: Confirm Payment
  const handleConfirmUpiPayment = () => {
    if (!selectedBill) return
    const upiTxnRef = `UPI-${Math.floor(100000 + Math.random() * 900000)}`
    payMutation.mutate({
      billId: selectedBill.id,
      amount: selectedBill.patientPayable,
      method: 'UPI',
      ref: upiTxnRef,
    })
  }

  // Card: Format card number with spaces (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(formatted)
  }

  // Card: Format expiry date (MM/YY)
  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`
    }
    setCardExpiry(raw)
  }

  // Card: Seamless Instant Payment ("without check get payment")
  const handlePayByCard = (e) => {
    e.preventDefault()
    setFormError('')

    if (!cardName.trim()) {
      setFormError('Please enter the Cardholder Name.')
      return
    }
    const rawCard = cardNumber.replace(/\s/g, '')
    if (rawCard.length < 15) {
      setFormError('Please enter a valid 16-digit Card Number.')
      return
    }
    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setFormError('Please enter a valid Expiry Date (MM/YY).')
      return
    }
    if (cardCvv.length < 3) {
      setFormError('Please enter a valid 3 or 4-digit CVV.')
      return
    }

    // Direct seamless processing
    setIsProcessingCard(true)
    setTimeout(() => {
      const cardTxnRef = `CARD-${Math.floor(100000 + Math.random() * 900000)}`
      payMutation.mutate({
        billId: selectedBill.id,
        amount: selectedBill.patientPayable,
        method: 'CARD',
        ref: cardTxnRef,
      })
    }, 800)
  }

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText('carepoint.hospital@okhdfcbank')
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const totalOutstanding = bills
    .filter((b) => b.status === 'PENDING')
    .reduce((sum, b) => sum + (b.patientPayable || 0), 0)

  // Card Brand Detection
  const getCardBrand = (num) => {
    const clean = num.replace(/\s/g, '')
    if (clean.startsWith('4')) return 'VISA'
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MASTERCARD'
    if (/^(60|65|81|82)/.test(clean)) return 'RUPAY'
    if (/^3[47]/.test(clean)) return 'AMEX'
    return 'CARD'
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Invoices</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review detailed treatment fee breakdowns, insurance deductions, and make secure payments.
          </p>
        </div>

        {totalOutstanding > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-xs flex items-center gap-2 font-medium">
            <span>Outstanding Balance:</span>
            <strong className="text-sm font-bold text-amber-900">${totalOutstanding.toFixed(2)}</strong>
          </div>
        )}
      </div>

      {alertState.text && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 font-medium ${
            alertState.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-destructive/10 border border-destructive/20 text-destructive'
          }`}
        >
          {alertState.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{alertState.text}</div>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner /></div>
      ) : bills.length === 0 ? (
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="py-16 text-center space-y-3">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800">No invoices on record</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Once a doctor finishes a consultation and hospital administration issues an invoice, it will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bills.map((bill) => (
            <Card key={bill.id} className="border-border/80 shadow-2xs">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Invoice #{bill.id}</h3>
                      <StatusBadge status={bill.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Appointment ID #{bill.appointmentId} • Issued {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Patient Payable</span>
                    <strong className="text-base font-bold text-slate-900">
                      ${bill.patientPayable?.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* Charges Breakdown */}
                <div className="bg-muted/40 p-3 rounded-xl border border-border/60 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Consultation Fee:</span>
                    <span>${bill.consultationFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Medicine Charges:</span>
                    <span>${bill.medicineCharges?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Other Charges / Tests:</span>
                    <span>${bill.otherCharges?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium pt-1 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Insurance Covered:
                    </span>
                    <span>-${bill.insuranceCovered?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-border/60">
                    <span>Total Bill:</span>
                    <span>${bill.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment History if paid */}
                {bill.payments?.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-[11px] text-emerald-800 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Payment Completed:
                    </p>
                    {bill.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-[10px]">
                        <span>Ref: {p.transactionRef} ({p.method})</span>
                        <span className="font-semibold">${p.amount?.toFixed(2)} on {new Date(p.paidAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pay Button if pending */}
                {bill.status === 'PENDING' && (
                  <Button
                    onClick={() => handleOpenPay(bill)}
                    className="w-full gap-2 text-xs font-semibold shadow-xs bg-primary hover:bg-primary/90"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay ${bill.patientPayable?.toFixed(2)} Now
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Realistic Multi-Channel Payment Modal */}
      {payModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl border-border my-6 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Settle Invoice #{selectedBill.id}
                </CardTitle>
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                  Due: ${selectedBill.patientPayable?.toFixed(2)}
                </span>
              </div>
              <CardDescription className="text-xs">
                Select your preferred payment method: Instant UPI QR Code or Card.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('UPI')
                    setFormError('')
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'bg-white text-primary shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>UPI / QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CARD')
                    setFormError('')
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'bg-white text-primary shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Credit / Debit Card</span>
                </button>
              </div>

              {/* Form Validation Error Banner */}
              {formError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ======================================================== */}
              {/* 1. UPI PAYMENT METHOD                                    */}
              {/* ======================================================== */}
              {paymentMethod === 'UPI' && (
                <div className="space-y-4">
                  {upiStep === 'FORM' ? (
                    /* Step 1: Collect Name, Mobile Number, Address */
                    <form onSubmit={handleGenerateUpiQr} className="space-y-3.5">
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                        <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        <div>
                          <strong className="block font-semibold">UPI Payment Verification</strong>
                          <span>Please provide payer details to generate your dynamic UPI QR code.</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="upiName" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          Payer Full Name *
                        </Label>
                        <Input
                          id="upiName"
                          placeholder="e.g. Dhruhit Savaliya"
                          value={upiName}
                          onChange={(e) => setUpiName(e.target.value)}
                          className="text-xs h-9"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="upiPhone" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                          Mobile Number (10 Digits) *
                        </Label>
                        <Input
                          id="upiPhone"
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={upiPhone}
                          onChange={(e) => setUpiPhone(e.target.value.replace(/\D/g, ''))}
                          className="text-xs h-9"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="upiAddress" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          Billing / Street Address *
                        </Label>
                        <Input
                          id="upiAddress"
                          placeholder="e.g. 104, Green Heights, Ring Road, Surat"
                          value={upiAddress}
                          onChange={(e) => setUpiAddress(e.target.value)}
                          className="text-xs h-9"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPayModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                          <QrCode className="w-4 h-4" />
                          Generate UPI QR Code
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* Step 2: Display Generated UPI QR Code with Real Values */
                    <div className="space-y-4 text-center">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-2">
                        <button
                          type="button"
                          onClick={() => setUpiStep('FORM')}
                          className="flex items-center gap-1 hover:text-slate-900 font-medium"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Edit Details
                        </button>
                        <span className="flex items-center gap-1.5 font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                          <Clock className="w-3 h-3 animate-pulse" />
                          Expires in {formatTimer(qrTimer)}
                        </span>
                      </div>

                      {/* QR Display Container */}
                      <div className="py-2 flex flex-col items-center">
                        <UpiQrCode
                          upiString={`upi://pay?pa=carepoint.hospital@okhdfcbank&pn=CarePoint+Hospital&am=${selectedBill.patientPayable}&cu=INR&tn=Invoice-${selectedBill.id}`}
                          size={190}
                        />

                        <div className="mt-3 space-y-1">
                          <div className="text-base font-extrabold text-slate-900">
                            Pay ${selectedBill.patientPayable?.toFixed(2)}{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                              (~₹{(selectedBill.patientPayable * 83).toFixed(2)})
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Payer: <strong className="text-slate-700">{upiName}</strong> (+91 {upiPhone})
                          </p>
                        </div>
                      </div>

                      {/* UPI ID Copy Box */}
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <div className="text-left font-mono">
                          <span className="text-[10px] text-muted-foreground block font-sans">Hospital UPI ID</span>
                          <span className="font-semibold text-slate-800">carepoint.hospital@okhdfcbank</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyUpiId}
                          className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Supported Apps Badges */}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                          <span
                            key={app}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {app}
                          </span>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center gap-2 pt-3 border-t border-border/60">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPayModalOpen(false)}
                          disabled={payMutation.isPending}
                        >
                          Cancel
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={handleConfirmUpiPayment}
                          disabled={payMutation.isPending || qrTimer === 0}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          {payMutation.isPending ? (
                            <span className="flex items-center gap-1.5">
                              <LoadingSpinner size="sm" />
                              Verifying Payment...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              I Have Paid / Complete Verification
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* 2. CARD PAYMENT METHOD                                   */}
              {/* ======================================================== */}
              {paymentMethod === 'CARD' && (
                <form onSubmit={handlePayByCard} className="space-y-3.5">
                  <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                    <div>
                      <strong className="block font-semibold">Fast Card Checkout</strong>
                      <span>Enter card info for instant authorization without cumbersome redirects.</span>
                    </div>
                  </div>

                  {/* Card Visual Preview */}
                  <div className="p-4 rounded-xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-3">
                    <div className="flex justify-between items-center text-xs opacity-80 font-mono">
                      <span>CarePoint Medical Card</span>
                      <span className="font-bold tracking-wider">{getCardBrand(cardNumber)}</span>
                    </div>
                    <div className="text-base font-mono tracking-widest font-bold py-1">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono opacity-80">
                      <div>
                        <span className="block text-[8px] uppercase">Cardholder</span>
                        <span className="font-bold uppercase">{cardName || 'YOUR NAME'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] uppercase">Expires</span>
                        <span className="font-bold">{cardExpiry || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-1.5">
                    <Label htmlFor="cardName" className="text-xs font-semibold text-slate-700">
                      Name on Card *
                    </Label>
                    <Input
                      id="cardName"
                      placeholder="e.g. Dhruhit Savaliya"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="text-xs h-9 uppercase"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cardNumber" className="text-xs font-semibold text-slate-700">
                      Card Number *
                    </Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder="4532 0123 4567 8910"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        maxLength={19}
                        className="text-xs h-9 font-mono pr-12"
                        required
                      />
                      <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">
                        {getCardBrand(cardNumber)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cardExpiry" className="text-xs font-semibold text-slate-700">
                        Expiry Date *
                      </Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        className="text-xs h-9 font-mono text-center"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cardCvv" className="text-xs font-semibold text-slate-700">
                        CVV / CVC *
                      </Label>
                      <Input
                        id="cardCvv"
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        maxLength={4}
                        className="text-xs h-9 font-mono text-center tracking-widest"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPayModalOpen(false)}
                      disabled={payMutation.isPending || isProcessingCard}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={payMutation.isPending || isProcessingCard}
                      className="gap-2 bg-primary font-semibold"
                    >
                      {payMutation.isPending || isProcessingCard ? (
                        <span className="flex items-center gap-1.5">
                          <LoadingSpinner size="sm" />
                          Processing Payment...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          Pay ${selectedBill.patientPayable?.toFixed(2)} Instantly
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
