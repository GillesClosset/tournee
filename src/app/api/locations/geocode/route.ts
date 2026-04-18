import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { geocodeAddress } from '@/lib/routing/ors-client'
import { z } from 'zod'

const geocodeBodySchema = z.object({
  address: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = geocodeBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    const result = await geocodeAddress(parsed.data.address)
    if (!result) {
      return NextResponse.json(
        { error: "Adresse introuvable — vérifiez l'adresse et réessayez" },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: result })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
