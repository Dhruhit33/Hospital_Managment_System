import React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'

const statusConfigs = {
  // Appointments
  BOOKED: {
    label: 'Booked',
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500 animate-pulse',
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
  },
  NO_SHOW: {
    label: 'No Show',
    bg: 'bg-red-50 text-red-700 border-red-200/80',
    dot: 'bg-red-500',
  },

  // Billing
  PAID: {
    label: 'Paid',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  PENDING: {
    label: 'Pending',
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500 animate-pulse',
  },

  // Roles
  ADMIN: {
    label: 'Administrator',
    bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
  },
  DOCTOR: {
    label: 'Doctor',
    bg: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dot: 'bg-teal-500',
  },
  PATIENT: {
    label: 'Patient',
    bg: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500',
  },

  // Account states
  ACTIVE: {
    label: 'Active',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  DISABLED: {
    label: 'Disabled',
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
  },
}

export function StatusBadge({ status, className }) {
  const config = statusConfigs[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border shadow-2xs transition-colors',
        config.bg,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      {config.label}
    </span>
  )
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
}
