'use client'

import { Location } from '@/lib/db/schema'
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

interface LocationTableProps {
  locations: Location[]
  onEdit: (location: Location) => void
  onToggleActive: (location: Location) => void
}

export function LocationTable({ locations, onEdit, onToggleActive }: LocationTableProps) {
  if (locations.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Aucun point de passage trouvé. Ajoutez-en un pour commencer.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Adresse</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Stationnement difficile</TableHead>
          <TableHead>Géocodé</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {locations.map((location) => (
          <TableRow key={location.id}>
            <TableCell className="font-medium">{location.name}</TableCell>
            <TableCell className="max-w-48 truncate text-muted-foreground">
              {location.address}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{location.locationType === 'villa' ? 'Villa' : 'RDV'}</Badge>
            </TableCell>
            <TableCell>{location.parkingDifficulty ? '✓' : '✗'}</TableCell>
            <TableCell>
              {location.latitude != null && location.longitude != null ? '✓' : '—'}
            </TableCell>
            <TableCell>
              <Badge variant={location.isActive ? 'default' : 'secondary'}>
                {location.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(location)}>
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant={location.isActive ? 'destructive' : 'secondary'}
                  onClick={() => onToggleActive(location)}
                >
                  {location.isActive ? 'Désactiver' : 'Réactiver'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
