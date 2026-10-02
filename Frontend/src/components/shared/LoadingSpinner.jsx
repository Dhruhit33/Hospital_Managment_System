import React from 'react'
import PropTypes from 'prop-types'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoadingSpinner({ size = 'default', text, className }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-10 h-10',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-8 gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
    </div>
  )
}

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  text: PropTypes.string,
  className: PropTypes.string,
}
