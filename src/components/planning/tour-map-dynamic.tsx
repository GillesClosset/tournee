import dynamic from 'next/dynamic'

export const TourMapDynamic = dynamic(() => import('./tour-map').then((m) => m.TourMap), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-lg" />,
})
