import React from 'react'
import PropTypes from 'prop-types'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error info gracefully without crashing
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            An unexpected error occurred in the user interface. Please try refreshing the page.
          </p>
          <Button onClick={this.handleReset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
}
