import React from 'react'
import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mb-6">
        The requested page does not exist or has been relocated within the hospital clinical system.
      </p>
      <Button asChild>
        <Link to="/login" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Go to Sign In
        </Link>
      </Button>
    </div>
  )
}
