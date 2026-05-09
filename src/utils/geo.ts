export function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

export function calculateDistanceKm(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number,
): number {
  const earthRadiusKm = 6371

  const latitudeDelta = toRadians(endLatitude - startLatitude)
  const longitudeDelta = toRadians(endLongitude - startLongitude)

  const latitude1 = toRadians(startLatitude)
  const latitude2 = toRadians(endLatitude)

  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))

  return earthRadiusKm * arc
}

export function kilometersToMiles(distanceKm: number): number {
  return distanceKm * 0.621371
}

export function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10
}
