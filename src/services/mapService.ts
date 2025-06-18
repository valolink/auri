import { Loader } from '@googlemaps/js-api-loader'

// Internal state
let map: google.maps.Map | null = null
let geometry: typeof google.maps.geometry
let overlay: google.maps.GroundOverlay | null = null

let mapRefEl: HTMLElement | null = null

const apiKey = 'AIzaSyBf1PZHkSB3LPI4sdepIKnr9ItR_Gc_KT4'

const loader = new Loader({
  apiKey,
  version: 'weekly',
  libraries: ['geometry', 'places'],
})

export async function ensureGoogleLoaded(): Promise<void> {
  if (!window.google?.maps) {
    await loader.load()
  }
}

// Load Maps and Geometry libraries
export const loadGoogleMaps = async (): Promise<void> => {
  if (window.google?.maps) return
  await loader.load()
  geometry = google.maps.geometry
}

// Initialize and store the map
export const initMap = async (
  el: HTMLElement,
  lat: number,
  lng: number,
  zoom: number = 18,
): Promise<google.maps.Map> => {
  await loadGoogleMaps()
  mapRefEl = el

  map = new google.maps.Map(el, {
    center: { lat, lng },
    zoom,
    mapTypeId: 'satellite',
    gestureHandling: 'greedy',
    tilt: 0,
    heading: 0,
    rotateControl: false,
  })

  return map
}

// Public getters
export const getMap = () => map
export const getGeometry = () => geometry
export const getMapRefEl = () => mapRefEl

// Overlay support
export const updateOverlay = (
  canvas: HTMLCanvasElement,
  bounds: google.maps.LatLngBoundsLiteral,
) => {
  overlay?.setMap(null)
  overlay = new google.maps.GroundOverlay(canvas.toDataURL(), bounds)
  overlay.setMap(map!)
}

export async function setupAddressAutocomplete(
  inputEl: HTMLInputElement,
  onPlaceChanged: (latLng: google.maps.LatLngLiteral, formatted?: string) => void,
): Promise<void> {
  await loadGoogleMaps()

  const autocomplete = new google.maps.places.Autocomplete(inputEl, {
    types: ['address'],
    componentRestrictions: { country: 'fi' },
  })

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (!place.geometry?.location) return

    const latLng = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    }

    onPlaceChanged(latLng, place.formatted_address ?? '')
  })
}
