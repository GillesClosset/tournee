import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { vehicles } from '@/lib/db/schema'
import { VehiclesPageClient } from '@/components/referentiels/vehicles-page-client'

export default async function VehiculesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const allVehicles = await db.select().from(vehicles).orderBy(vehicles.name)

  return <VehiclesPageClient initialVehicles={allVehicles} />
}
