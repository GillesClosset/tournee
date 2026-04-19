'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Une erreur est survenue</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Quelque chose s&apos;est mal passé. Veuillez réessayer ou contacter l&apos;administrateur
          si le problème persiste.
        </p>
        <Button onClick={reset}>Réessayer</Button>
      </div>
    </div>
  )
}
