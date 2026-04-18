'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Vehicle } from '@/lib/db/schema'
import { VehicleTable } from '@/components/referentiels/vehicle-table'
import { VehicleForm } from '@/components/referentiels/vehicle-form'
import { Button } from '@/components/ui/button'

interface VehiclesPageClientProps {
  initialVehicles: Vehicle[]
}

export function VehiclesPageClient({ initialVehicles }: VehiclesPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>()

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  function handleEdit(vehicle: Vehicle) {
    setSelectedVehicle(vehicle)
    setFormOpen(true)
  }

  function handleAdd() {
    setSelectedVehicle(undefined)
    setFormOpen(true)
  }

  async function handleToggleActive(vehicle: Vehicle) {
    try {
      const response = await fetch('/api/vehicles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vehicle.id, is_active: !vehicle.isActive }),
      })
      if (!response.ok) throw new Error('Erreur serveur')
      toast.success(vehicle.isActive ? 'Véhicule désactivé' : 'Véhicule réactivé')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Véhicules</h1>
        <Button onClick={handleAdd}>Ajouter</Button>
      </div>

      <VehicleTable
        vehicles={initialVehicles}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      <VehicleForm
        vehicle={selectedVehicle}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
