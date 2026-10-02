import React from 'react'
import PropTypes from 'prop-types'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CarePointLogo({
  size = 'md',
  className,
  iconOnly = false,
  showSubtitle = true,
  subtitle,
}) {
  const boxSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl',
  }

  const iconSizes = {
    sm: 'w-4 h-4 stroke-[2.5]',
    md: 'w-5 h-5 stroke-[2.5]',
    lg: 'w-7 h-7 stroke-[2.5]',
    xl: 'w-8 h-8 stroke-[2.5]',
  }

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {/* Brand Icon Box: Dark backdrop with luminous teal ECG pulse wave */}
      <div
        className={cn(
          boxSizes[size] || boxSizes.md,
          'bg-slate-900 border border-slate-700/80 text-teal-400 flex items-center justify-center shadow-sm shadow-teal-500/10 shrink-0 group'
        )}
      >
        <Activity
          className={cn(
            iconSizes[size] || iconSizes.md,
            'text-teal-400 transition-transform group-hover:scale-105'
          )}
        />
      </div>

      {!iconOnly && (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
              CarePoint
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200/60 px-1.5 py-0.5 rounded-md">
              Health
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[10px] text-slate-500 font-medium block">
              {subtitle || 'Clinical Healthcare System'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

CarePointLogo.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  iconOnly: PropTypes.bool,
  showSubtitle: PropTypes.bool,
  subtitle: PropTypes.string,
}
