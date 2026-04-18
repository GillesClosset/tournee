'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Driver } from '@/lib/db/schema'
import { DriverTable } from '@/components/referentiels/driver-table'
import { DriverForm } from '@/components/referentiels/driver-form'
import { Button } from '@/components/ui/button'

interface DriversPageClientProps {
  initialDrivers: Driver[]
}

export function DriversPageClient({ initialDrivers }: DriversPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | undefined>()

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  function handleEdit(driver: Driver) {
    setSelectedDriver(driver)
    setFormOpen(true)
  }

  function handleAdd() {
    setSelectedDriver(undefined)
    setFormOpen(true)
  }

  async function handleToggleActive(driver: Driver) {
    try {
      const response = await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: driver.id, is_active: !driver.isActive }),
      })
      if (!response.ok) throw new Error('Erreur serveur')
      toast.success(driver.isActive ? 'Chauffeur désactivé' : 'Chauffeur réactivé')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chauffeurs</h1>
        <Button onClick={handleAdd}>Ajouter</Button>
      </div>

      <DriverTable
        drivers={initialDrivers}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      <DriverForm
        driver={selectedDriver}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
