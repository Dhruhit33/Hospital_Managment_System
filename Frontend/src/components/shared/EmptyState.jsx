import React from 'react'
import PropTypes from 'prop-types'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-xl border border-dashed border-border/80 my-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
}
