export interface LatLng {
  lat: () => number
  lng: () => number
}

export interface BuildingInsightsResponse {
  // Add relevant fields from the response if needed
  name: string
  solarPotential: any
}

export async function findClosestBuilding(
  location: LatLng,
  apiKey: string,
): Promise<BuildingInsightsResponse> {
  const args = {
    'location.latitude': location.lat().toFixed(5),
    'location.longitude': location.lng().toFixed(5),
  }
  const params = new URLSearchParams({ ...args, key: apiKey })

  const response = await fetch(
    `https://solar.googleapis.com/v1/buildingInsights:findClosest?${params}`,
  )
  const content = await response.json()

  if (!response.ok) {
    console.error('API Error:', content)
    throw new Error(content.error?.message || 'API request failed')
  }

  return content
}
