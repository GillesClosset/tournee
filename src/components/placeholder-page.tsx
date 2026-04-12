import { Card, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PlaceholderPageProps {
  title: string
  description: string
  lot: string
}

export function PlaceholderPage({ title, description, lot }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <CardAction>
            <Badge variant="secondary">{lot}</Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  )
}
