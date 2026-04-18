import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { locations } from '@/lib/db/schema'
import { LocationsPageClient } from '@/components/referentiels/locations-page-client'

export default async function PointsDePassagePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const allLocations = await db.select().from(locations).orderBy(locations.name)

  return <LocationsPageClient initialLocations={allLocations} />
}
