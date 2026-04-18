'use client'

import { Vehicle } from '@/lib/db/schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface VehicleTableProps {
  vehicles: Vehicle[]
  onEdit: (vehicle: Vehicle) => void
  onToggleActive: (vehicle: Vehicle) => void
}

export function VehicleTable({ vehicles, onEdit, onToggleActive }: VehicleTableProps) {
  if (vehicles.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Aucun véhicule trouvé. Ajoutez-en un pour commencer.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Immatriculation</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((vehicle) => (
          <TableRow key={vehicle.id}>
            <TableCell className="font-medium">{vehicle.name}</TableCell>
            <TableCell className="font-mono">{vehicle.licensePlate}</TableCell>
            <TableCell>
              <Badge variant={vehicle.isActive ? 'default' : 'secondary'}>
                {vehicle.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{vehicle.notes ?? '—'}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(vehicle)}>
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant={vehicle.isActive ? 'destructive' : 'secondary'}
                  onClick={() => onToggleActive(vehicle)}
                >
                  {vehicle.isActive ? 'Désactiver' : 'Réactiver'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
