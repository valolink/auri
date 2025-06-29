export interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

export interface GeocodeLatLng {
  lat: number
  lng: number
  formattedAddress: string
  addressComponents: AddressComponent[]
}

/**
 * Formats address components into a typical Finnish address format
 * @param addressComponents - Array of address components from Google Geocoding API
 * @returns Formatted address string like "Kadunnimi 2, 00500 Helsinki"
 */
export function formatFinnishAddress(addressComponents: AddressComponent[]): string {
  let streetNumber = ''
  let route = ''
  let postalCode = ''
  let locality = ''

  // Extract relevant components
  for (const component of addressComponents) {
    if (component.types.includes('street_number')) {
      streetNumber = component.long_name
    } else if (component.types.includes('route')) {
      route = component.long_name
    } else if (component.types.includes('postal_code')) {
      postalCode = component.long_name
    } else if (component.types.includes('locality') || component.types.includes('administrative_area_level_3')) {
      locality = component.long_name
    }
  }

  // Build Finnish format address: "Street name number, postal code city"
  let formattedAddress = ''
  
  if (route) {
    formattedAddress += route
    if (streetNumber) {
      formattedAddress += ` ${streetNumber}`
    }
  }
  
  if (postalCode || locality) {
    if (formattedAddress) {
      formattedAddress += ', '
    }
    if (postalCode) {
      formattedAddress += postalCode
      if (locality) {
        formattedAddress += ` ${locality}`
      }
    } else if (locality) {
      formattedAddress += locality
    }
  }

  return formattedAddress || 'Osoite ei saatavilla'
}

/**
 * Performs reverse geocoding to get address information from coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @param apiKey - Google Maps API key
 * @returns Promise<GeocodeLatLng> - Geocoded location with address components
 */
export async function reverseGeocode(lat: number, lng: number, apiKey: string): Promise<GeocodeLatLng> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0]
      
      // Convert Google's address_components to our AddressComponent interface
      const addressComponents: AddressComponent[] = result.address_components.map((component: any) => ({
        long_name: component.long_name,
        short_name: component.short_name,
        types: component.types
      }))
      
      return {
        lat,
        lng,
        formattedAddress: result.formatted_address,
        addressComponents
      }
    } else {
      // Fallback if reverse geocoding fails
      return {
        lat,
        lng,
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        addressComponents: []
      }
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error)
    // Fallback if request fails
    return {
      lat,
      lng,
      formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      addressComponents: []
    }
  }
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

  const result = data.results[0]
  const location = result.geometry.location
  
  return { 
    lat: location.lat, 
    lng: location.lng,
    formattedAddress: result.formatted_address,
    addressComponents: result.address_components
  }
}
