// Domain types — will be populated in Lot 1+

export interface Driver {
  id: string
  name: string
  is_active: boolean
  notes: string | null
}

export interface Vehicle {
  id: string
  name: string
  license_plate: string
  is_active: boolean
  notes: string | null
}

export interface Location {
  id: string
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  parking_difficulty: boolean
  location_type: 'villa' | 'rdv'
  is_active: boolean
  notes: string | null
}
