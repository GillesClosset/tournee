import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { drivers } from '@/lib/db/schema'
import { DriversPageClient } from '@/components/referentiels/drivers-page-client'

export default async function ChauffeursPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const allDrivers = await db.select().from(drivers).orderBy(drivers.name)

  return <DriversPageClient initialDrivers={allDrivers} />
}
