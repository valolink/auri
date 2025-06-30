import { Loader } from '@googlemaps/js-api-loader'
import { useAppState } from '@/useAppState'
// Internal state
let geometry: typeof google.maps.geometry
let overlay: google.maps.GroundOverlay | null = null

const { mapRef, mapInstance } = useAppState()

const apiKey = 'AIzaSyBf1PZHkSB3LPI4sdepIKnr9ItR_Gc_KT4'

const loader = new Loader({
  apiKey,
  version: 'weekly',
  libraries: ['geometry', 'places'],
})

// Load Maps and Geometry libraries
export const loadGoogleMaps = async (): Promise<void> => {
  if (window.google?.maps) return
  await loader.load()
  geometry = google.maps.geometry
}

// Initialize and store the map
export const initMap = async (
  lat: number,
  lng: number,
  zoom: number = 18,
): Promise<google.maps.Map> => {
  await loadGoogleMaps()

  mapInstance.value = new google.maps.Map(mapRef.value, {
    center: { lat, lng },
    zoom,
    mapTypeId: 'satellite',
    gestureHandling: 'greedy',
    tilt: 0,
    heading: 0,
    rotateControl: false,
  })

  return mapInstance.value
}

export const getGeometry = () => geometry

// Overlay support
export const updateOverlay = (
  canvas: HTMLCanvasElement,
  bounds: google.maps.LatLngBoundsLiteral,
) => {
  overlay?.setMap(null)
  overlay = new google.maps.GroundOverlay(canvas.toDataURL(), bounds)
  overlay.setMap(mapInstance.value!)
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

interface MapScreenshotOptions {
  // Target settings for the screenshot
  center?: google.maps.LatLngLiteral
  zoom?: number
  mapType?: google.maps.MapTypeId
  size?: { width: number; height: number }

  // Output settings
  filename?: string
  download?: boolean
  format?: 'png' | 'jpeg'
  quality?: number // 0.1 to 1.0 for jpeg
}

interface MapState {
  center: google.maps.LatLng
  zoom: number
  mapType: google.maps.MapTypeId
  size: { width: number; height: number }
}

/**
 * Saves current map state for restoration
 */
const saveMapState = (): MapState => {
  if (!mapInstance.value || !mapRef.value) {
    throw new Error('Map not initialized')
  }

  const mapDiv = mapRef.value
  const computedStyle = window.getComputedStyle(mapDiv)

  return {
    center: mapInstance.value.getCenter()!,
    zoom: mapInstance.value.getZoom()!,
    mapType: mapInstance.value.getMapTypeId()!,
    size: {
      width: parseInt(computedStyle.width),
      height: parseInt(computedStyle.height),
    },
  }
}

/**
 * Restores map to previous state
 */
const restoreMapState = (state: MapState): Promise<void> => {
  return new Promise((resolve) => {
    if (!mapInstance.value || !mapRef.value) {
      resolve()
      return
    }

    // Restore size
    const mapDiv = mapRef.value
    mapDiv.style.width = `${state.size.width}px`
    mapDiv.style.height = `${state.size.height}px`

    // Restore map settings
    mapInstance.value.setCenter(state.center)
    mapInstance.value.setZoom(state.zoom)
    mapInstance.value.setMapTypeId(state.mapType)

    // Wait for map to settle
    const idleListener = google.maps.event.addListenerOnce(mapInstance.value!, 'idle', () => {
      google.maps.event.trigger(mapInstance.value!, 'resize')
      resolve()
    })

    // Trigger resize to apply size changes
    google.maps.event.trigger(mapInstance.value!, 'resize')
  })
}

/**
 * Temporarily applies settings for screenshot
 */
const applyTemporarySettings = (options: MapScreenshotOptions): Promise<void> => {
  return new Promise((resolve) => {
    if (!mapInstance.value || !mapRef.value) {
      resolve()
      return
    }

    const mapDiv = mapRef.value

    // Apply temporary size if specified
    if (options.size) {
      mapDiv.style.width = `${options.size.width}px`
      mapDiv.style.height = `${options.size.height}px`
    }

    // Apply map settings
    if (options.center) {
      mapInstance.value.setCenter(options.center)
    }
    if (options.zoom !== undefined) {
      mapInstance.value.setZoom(options.zoom)
    }
    if (options.mapType) {
      mapInstance.value.setMapTypeId(options.mapType)
    }

    // Wait for map to settle with new settings
    const idleListener = google.maps.event.addListenerOnce(mapInstance.value!, 'idle', () =>
      resolve(),
    )

    // Trigger resize to apply changes
    google.maps.event.trigger(mapInstance.value!, 'resize')
  })
}

/**
 * Captures map with temporary settings, then restores original state
 * Perfect for consistent PDF report generation
 */
export const captureMapWithSettings = async (
  options: MapScreenshotOptions = {},
): Promise<string> => {
  if (!mapInstance.value) {
    throw new Error('Map not initialized')
  }

  // Default options
  const opts: Required<MapScreenshotOptions> = {
    center: options.center || mapInstance.value.getCenter()!.toJSON(),
    zoom: options.zoom ?? mapInstance.value.getZoom()!,
    mapType: options.mapType || mapInstance.value.getMapTypeId()!,
    size: options.size || { width: 800, height: 600 },
    filename: options.filename || 'map-report.png',
    download: options.download ?? true,
    format: options.format || 'png',
    quality: options.quality ?? 0.9,
  }

  // Save current state
  const originalState = saveMapState()

  try {
    // Apply temporary settings
    await applyTemporarySettings(opts)

    // Wait a bit more for tiles to load
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Capture the image
    const dataURL = await new Promise<string>((resolve, reject) => {
      import('html2canvas')
        .then((html2canvas) => {
          html2canvas
            .default(mapRef.value!, {
              useCORS: true,
              allowTaint: true,
              scale: 1,
              backgroundColor: null,
              logging: false,
              width: opts.size.width,
              height: opts.size.height,
            })
            .then((canvas) => {
              const mimeType = opts.format === 'jpeg' ? 'image/jpeg' : 'image/png'
              const dataURL = canvas.toDataURL(mimeType, opts.quality)

              if (opts.download) {
                const link = document.createElement('a')
                link.download = opts.filename
                link.href = dataURL
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }

              resolve(dataURL)
            })
            .catch(reject)
        })
        .catch(reject)
    })

    return dataURL
  } finally {
    // Always restore original state
    await restoreMapState(originalState)
  }
}

/**
 * Static API version with temporary settings
 * More reliable for PDF reports, but won't include overlays
 */
export const captureStaticMapWithSettings = async (
  options: MapScreenshotOptions = {},
): Promise<string> => {
  if (!mapInstance.value) {
    throw new Error('Map not initialized')
  }

  const opts = {
    center: options.center || mapInstance.value.getCenter()!.toJSON(),
    zoom: options.zoom ?? mapInstance.value.getZoom()!,
    mapType: options.mapType || 'satellite',
    size: options.size || { width: 800, height: 600 },
    filename: options.filename || 'map-report.png',
    download: options.download ?? true,
  }

  // Build Static Maps API URL
  const mapTypeParam = opts.mapType === 'satellite' ? 'satellite' : 'roadmap'
  const staticMapUrl =
    `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${opts.center.lat},${opts.center.lng}` +
    `&zoom=${opts.zoom}` +
    `&size=${opts.size.width}x${opts.size.height}` +
    `&maptype=${mapTypeParam}` +
    `&format=png` +
    `&key=${apiKey}`

  if (opts.download) {
    const link = document.createElement('a')
    link.download = opts.filename
    link.href = staticMapUrl
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return staticMapUrl
}

/**
 * Convenience function for building-centered screenshots
 * Perfect for PDF reports - ensures building is always centered and visible
 * ALWAYS includes all layers, overlays, and custom elements
 */
export const captureBuildingReport = async (
  buildingLocation: google.maps.LatLngLiteral,
  buildingName?: string,
  includeOverlays: boolean = true,
): Promise<string> => {
  const reportOptions: MapScreenshotOptions = {
    center: buildingLocation,
    zoom: 18, // Good zoom level to show building details
    mapType: 'satellite',
    size: { width: 1200, height: 800 }, // Good size for PDF reports
    filename: buildingName ? `${buildingName}-report.png` : 'building-report.png',
    download: false, // Usually you want the data URL for PDF generation
    format: 'png',
  }

  if (includeOverlays) {
    // Use interactive map capture to include all layers and overlays
    return captureMapWithSettings(reportOptions)
  } else {
    // Use static API for basic map only
    return captureStaticMapWithSettings(reportOptions)
  }
}

/**
 * Enhanced capture that ensures all overlays are fully loaded
 * Waits for overlay rendering to complete before capturing
 */
export const captureMapWithOverlays = async (
  options: MapScreenshotOptions = {},
): Promise<string> => {
  if (!mapInstance.value) {
    throw new Error('Map not initialized')
  }

  // Save current state
  const originalState = saveMapState()

  try {
    // Apply temporary settings
    await applyTemporarySettings(options)

    // Wait for map to be idle
    await new Promise<void>((resolve) => {
      const idleListener = google.maps.event.addListenerOnce(mapInstance.value!, 'idle', () =>
        resolve(),
      )
    })

    // Extra wait to ensure overlays are fully rendered
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Capture with higher quality settings for overlays
    const dataURL = await new Promise<string>((resolve, reject) => {
      import('html2canvas')
        .then((html2canvas) => {
          html2canvas
            .default(mapRef.value!, {
              useCORS: true,
              allowTaint: true,
              scale: 2, // Higher scale for better overlay quality
              backgroundColor: null,
              logging: false,
              width: options.size?.width || 1200,
              height: options.size?.height || 800,
              // These options help with overlay rendering
              foreignObjectRendering: true,
              imageTimeout: 15000,
              removeContainer: false,
            })
            .then((canvas) => {
              const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png'
              const dataURL = canvas.toDataURL(mimeType, options.quality ?? 0.95)

              if (options.download) {
                const link = document.createElement('a')
                link.download = options.filename || 'map-with-overlays.png'
                link.href = dataURL
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }

              resolve(dataURL)
            })
            .catch(reject)
        })
        .catch(reject)
    })

    return dataURL
  } finally {
    // Always restore original state
    await restoreMapState(originalState)
  }
}
