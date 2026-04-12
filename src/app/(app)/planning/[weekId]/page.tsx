import { PlaceholderPage } from '@/components/placeholder-page'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function WeekPage(props: { params: Promise<{ weekId: string }> }) {
  return (
    <PlaceholderPage
      title="Semaine"
      description="Vue d'ensemble de la semaine — Configuration, Import, Génération, Export"
      lot="Lot 2"
    />
  )
}
