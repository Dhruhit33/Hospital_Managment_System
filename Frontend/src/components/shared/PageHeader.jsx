import React from 'react'
import PropTypes from 'prop-types'

/**
 * Consistent page header with title, subtitle, and primary actions.
 */
export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-border/60">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node,
}
