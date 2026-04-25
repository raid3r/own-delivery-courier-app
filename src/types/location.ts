export interface Location {
  lat: number
  lng: number
}
export interface LocationUpdate {
  courierId: string
  location: Location
  timestamp: string
}
