export interface LatLngCoords {
  latitude: number
  longitude: number
}

export interface DataLayersResponse {
  rgbUrl?: string
  // other urls can be added as needed
}

export async function getDataLayerUrls(
  location: LatLngCoords,
  radiusMeters: number,
  apiKey: string,
): Promise<DataLayersResponse> {
  const args = {
    'location.latitude': location.latitude.toFixed(5),
    'location.longitude': location.longitude.toFixed(5),
    radius_meters: radiusMeters.toString(),
    required_quality: 'LOW',
  }

  const params = new URLSearchParams({ ...args, key: apiKey })

  const response = await fetch(`https://solar.googleapis.com/v1/dataLayers:get?${params}`)
  const content = await response.json()

  if (!response.ok) {
    throw new Error(content.error?.message || 'Failed to fetch data layers')
  }

  return content
}
