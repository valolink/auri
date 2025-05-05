export interface GeocodeLatLng {
  lat: number
  lng: number
}

export async function geocodeAddress(address: string, apiKey: string): Promise<GeocodeLatLng> {
  const encoded = encodeURIComponent(address)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== 'OK') {
    console.error('Geocoding error:', data)
    throw new Error(data.error_message || 'Geocoding failed')
  }

  const location = data.results[0].geometry.location
  return { lat: location.lat, lng: location.lng }
}
