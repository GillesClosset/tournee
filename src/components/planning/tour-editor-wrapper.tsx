'use client'

import dynamic from 'next/dynamic'
import type { ToursPageData } from '@/types/domain'

const TourEditor = dynamic(
  () => import('@/components/planning/tour-editor').then((m) => m.TourEditor),
  {
    ssr: false,
    loading: () => (
      <div className="text-muted-foreground py-12 text-center">Chargement de l&apos;éditeur…</div>
    ),
  },
)

export function TourEditorWrapper({
  data,
  scheduleId,
}: {
  data: ToursPageData
  scheduleId: string
}) {
  return <TourEditor data={data} scheduleId={scheduleId} />
}
