'use client'

import { FileSpreadsheet, FileText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

interface ExportClientProps {
  scheduleId: string
  weekStartDate: string
}

export function ExportClient({ scheduleId, weekStartDate }: ExportClientProps) {
  const excelUrl = `/api/schedules/${scheduleId}/export/excel`
  const pdfUrl = `/api/schedules/${scheduleId}/export/pdf`

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Téléchargez le planning de la semaine du {weekStartDate.split('-').reverse().join('/')} au
        format Excel ou PDF.
      </p>

      <div className="flex gap-4">
        <a href={excelUrl} download className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          Télécharger Excel
        </a>

        <a href={pdfUrl} download className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          <FileText className="mr-2 h-5 w-5" />
          Télécharger PDF
        </a>
      </div>
    </div>
  )
}
