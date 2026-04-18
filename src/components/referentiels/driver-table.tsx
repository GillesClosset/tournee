'use client'

import { Driver } from '@/lib/db/schema'
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

interface DriverTableProps {
  drivers: Driver[]
  onEdit: (driver: Driver) => void
  onToggleActive: (driver: Driver) => void
}

export function DriverTable({ drivers, onEdit, onToggleActive }: DriverTableProps) {
  if (drivers.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Aucun chauffeur trouvé. Ajoutez-en un pour commencer.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drivers.map((driver) => (
          <TableRow key={driver.id}>
            <TableCell className="font-medium">{driver.name}</TableCell>
            <TableCell>
              <Badge variant={driver.isActive ? 'default' : 'secondary'}>
                {driver.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{driver.notes ?? '—'}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(driver)}>
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant={driver.isActive ? 'destructive' : 'secondary'}
                  onClick={() => onToggleActive(driver)}
                >
                  {driver.isActive ? 'Désactiver' : 'Réactiver'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
