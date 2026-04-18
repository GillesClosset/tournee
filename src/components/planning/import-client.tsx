'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ImportReport {
  imported: number
  warnings: string[]
  errors: string[]
}

export function ImportClient({ scheduleId }: { scheduleId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ImportReport | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return

    setLoading(true)
    setReport(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/schedules/${scheduleId}/import`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setReport({ imported: 0, warnings: [], errors: [data.error || 'Erreur serveur'] })
      } else {
        setReport(data)
      }
    } catch {
      setReport({ imported: 0, warnings: [], errors: ['Erreur réseau'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import du fichier de demandes</CardTitle>
          <CardDescription>
            Sélectionnez le fichier Excel (.xlsx) contenant le tableau de demandes de la semaine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <Button onClick={handleUpload} disabled={!file || loading}>
              {loading ? 'Import en cours…' : 'Importer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rapport d&apos;import</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {report.imported > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">
                    ✓ {report.imported} mission{report.imported > 1 ? 's' : ''} importée
                    {report.imported > 1 ? 's' : ''}
                  </Badge>
                </div>
              )}

              {report.warnings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">
                    Avertissements ({report.warnings.length})
                  </p>
                  <ul className="text-sm text-amber-700 list-disc pl-4 space-y-0.5">
                    {report.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">
                    Erreurs ({report.errors.length})
                  </p>
                  <ul className="text-sm text-red-700 list-disc pl-4 space-y-0.5">
                    {report.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {report.imported === 0 && report.errors.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune mission importée.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
