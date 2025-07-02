// mapService.ts
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

/**
 * Calculate appropriate zoom level based on building radius
 * Ensures the building and its analysis area fit nicely in the map view
 */
export const calculateZoomFromRadius = (
  radiusMeters: number,
  paddingFactor: number = 1.5, // How much extra space around the building
): number => {
  // Calculate the effective radius we need to show (building + padding)
  const effectiveRadius = radiusMeters * paddingFactor
  const diameterMeters = effectiveRadius * 2

  const mapContainerSize = {
    width: mapRef.value?.offsetWidth || 400,
    height: mapRef.value?.offsetHeight || 400,
  }
  // Use the smaller dimension to ensure the area fits in both width and height
  const minDimension = Math.min(mapContainerSize.width, mapContainerSize.height)

  // Google Maps zoom calculation:
  // At zoom level z, the world is 256 * 2^z pixels wide
  // At the equator, this represents 40,075,016.686 meters (Earth's circumference)
  // At latitude lat, this is scaled by cos(lat * π/180)

  const earthCircumference = 40075016.686 // meters
  const latitudeRadians = (60.17 * Math.PI) / 180
  const metersPerPixelAtZoom0 = (earthCircumference * Math.cos(latitudeRadians)) / 256

  // Calculate required meters per pixel to fit the diameter in the container
  const requiredMetersPerPixel = diameterMeters / minDimension

  // Calculate zoom level: metersPerPixel = metersPerPixelAtZoom0 / (2^zoom)
  // So: zoom = log2(metersPerPixelAtZoom0 / requiredMetersPerPixel)
  const calculatedZoom = Math.log2(metersPerPixelAtZoom0 / requiredMetersPerPixel)

  // Round to nearest integer and constrain to reasonable bounds
  const zoom = Math.max(8, Math.min(21, Math.round(calculatedZoom)))

  console.log(`🔍 Zoom calculation:`)
  console.log(`  Building radius: ${radiusMeters}m`)
  console.log(`  Effective diameter: ${diameterMeters}m`)
  console.log(`  Container size: ${minDimension}px`)
  console.log(`  Required m/px: ${requiredMetersPerPixel.toFixed(2)}`)
  console.log(`  Calculated zoom: ${calculatedZoom.toFixed(1)} → ${zoom}`)

  return zoom
}

// Initialize and store the map
export const initMap = async (
  lat: number,
  lng: number,
  radiusMeters?: number,
  mapContainerSize?: { width: number; height: number },
): Promise<google.maps.Map> => {
  await loadGoogleMaps()

  // Calculate zoom based on radius, or use default
  let zoom = 18 // Default zoom

  if (radiusMeters) {
    zoom = calculateZoomFromRadius(radiusMeters)
    console.log(`🔍 Auto-calculated zoom ${zoom} for ${radiusMeters}m radius`)
  }

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

export const updateOverlay = (
  canvas: HTMLCanvasElement,
  bounds: google.maps.LatLngBoundsLiteral,
) => {
  overlay?.setMap(null)
  overlay = new google.maps.GroundOverlay(canvas.toDataURL(), bounds)
  overlay.setMap(mapInstance.value!)

  // Add this line to register the flux overlay
  registerMapLayer('flux_overlay', canvas, {
    type: 'canvas',
    opacity: 0.7,
    zIndex: 10,
    description: 'Solar irradiance heat map overlay',
  })

  console.log('🔥 Solar flux overlay registered for capture')
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

// Layer management system for map overlays
interface MapLayer {
  name: string
  type: 'canvas' | 'image' | 'polygon' | 'marker'
  element: HTMLElement | HTMLCanvasElement | HTMLImageElement
  opacity: number
  visible: boolean
  zIndex: number
  description?: string
}

// Global layer registry
const mapLayers = new Map<string, MapLayer>()

/**
 * Register a layer for capture
 */
export const registerMapLayer = (
  name: string,
  element: HTMLElement | HTMLCanvasElement | HTMLImageElement,
  options: {
    type: 'canvas' | 'image' | 'polygon' | 'marker'
    opacity?: number
    visible?: boolean
    zIndex?: number
    description?: string
  },
) => {
  mapLayers.set(name, {
    name,
    element,
    type: options.type,
    opacity: options.opacity ?? 1.0,
    visible: options.visible ?? true,
    zIndex: options.zIndex ?? 0,
    description: options.description,
  })

  console.log(`📋 Registered layer: ${name} (${options.type})`)
}

/**
 * Update layer properties
 */
export const updateLayer = (name: string, updates: Partial<MapLayer>) => {
  const layer = mapLayers.get(name)
  if (layer) {
    Object.assign(layer, updates)
    console.log(`🔄 Updated layer: ${name}`)
  }
}

/**
 * Get all registered layers
 */
export const getAllLayers = (): MapLayer[] => {
  return Array.from(mapLayers.values()).sort((a, b) => a.zIndex - b.zIndex)
}

/**
 * Get layers by type
 */
export const getLayersByType = (type: MapLayer['type']): MapLayer[] => {
  return getAllLayers().filter((layer) => layer.type === type)
}

/**
 * Toggle layer visibility
 */
export const toggleLayer = (name: string): boolean => {
  const layer = mapLayers.get(name)
  if (layer) {
    layer.visible = !layer.visible
    console.log(`👁️ Layer ${name} is now ${layer.visible ? 'visible' : 'hidden'}`)
    return layer.visible
  }
  return false
}

/**
 * Improved hybrid capture with proper aspect ratio and sizing
 * Uses the map as the baseline and properly scales overlays
 */
export const captureMapWithProperSizing = async (
  options: MapScreenshotOptions = {},
): Promise<string> => {
  if (!mapInstance.value || !mapRef.value) {
    throw new Error('Map not initialized')
  }

  const currentCenter = mapInstance.value.getCenter()!.toJSON()
  const currentZoom = mapInstance.value.getZoom()!
  const size = options.size || { width: 1200, height: 800 }

  console.log('🎯 Starting improved hybrid capture with proper sizing...')

  // Step 1: Get base map at exact size (this is our baseline)
  const staticMapUrl =
    `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${currentCenter.lat},${currentCenter.lng}` +
    `&zoom=${currentZoom}` +
    `&size=${size.width}x${size.height}` +
    `&maptype=satellite` +
    `&format=png` +
    `&key=${apiKey}`

  const baseImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = staticMapUrl
  })

  // Step 2: Create canvas with exact target size
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')!

  // Draw base map (this sets our coordinate system)
  ctx.drawImage(baseImage, 0, 0, size.width, size.height)

  console.log(`✅ Base map drawn at ${size.width}x${size.height}`)

  // Step 3: Get current map bounds for coordinate mapping
  const bounds = mapInstance.value.getBounds()!
  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()

  // Helper function to convert lat/lng to canvas coordinates
  const latLngToCanvas = (lat: number, lng: number) => {
    const x = ((lng - sw.lng()) / (ne.lng() - sw.lng())) * size.width
    const y = ((ne.lat() - lat) / (ne.lat() - sw.lat())) * size.height
    return { x, y }
  }

  // Step 4: Draw flux overlay with proper aspect ratio
  try {
    console.log('🔥 Drawing flux overlay with proper sizing...')

    const mapContainer = mapRef.value.querySelector('.gm-style')
    if (mapContainer) {
      // Find flux overlay images
      const overlayImages = mapContainer.querySelectorAll('img[src*="data:image/png"]')

      overlayImages.forEach((img: HTMLImageElement, index) => {
        if (img.naturalWidth > 100 && img.naturalHeight > 100) {
          console.log(`🖼️ Processing flux image ${index}: ${img.naturalWidth}x${img.naturalHeight}`)

          // Get the image's current position and size in the DOM
          const imgRect = img.getBoundingClientRect()
          const mapRect = mapRef.value!.getBoundingClientRect()

          // Calculate where this image should be positioned on our canvas
          // Use the map container as reference, not the image's DOM position
          const relativeX = (imgRect.left - mapRect.left) / mapRect.width
          const relativeY = (imgRect.top - mapRect.top) / mapRect.height
          const relativeWidth = imgRect.width / mapRect.width
          const relativeHeight = imgRect.height / mapRect.height

          console.log(`📍 Flux overlay relative position:`, {
            x: relativeX,
            y: relativeY,
            width: relativeWidth,
            height: relativeHeight,
          })

          // Calculate canvas position maintaining aspect ratio
          const canvasX = relativeX * size.width
          const canvasY = relativeY * size.height
          const canvasWidth = relativeWidth * size.width
          const canvasHeight = relativeHeight * size.height

          // Maintain aspect ratio of the original image
          const imgAspectRatio = img.naturalWidth / img.naturalHeight
          const targetAspectRatio = canvasWidth / canvasHeight

          let finalWidth = canvasWidth
          let finalHeight = canvasHeight
          let finalX = canvasX
          let finalY = canvasY

          if (Math.abs(imgAspectRatio - targetAspectRatio) > 0.1) {
            // Aspect ratios differ significantly, adjust to maintain image aspect ratio
            if (imgAspectRatio > targetAspectRatio) {
              // Image is wider, adjust height
              finalHeight = finalWidth / imgAspectRatio
              finalY = canvasY + (canvasHeight - finalHeight) / 2
            } else {
              // Image is taller, adjust width
              finalWidth = finalHeight * imgAspectRatio
              finalX = canvasX + (canvasWidth - finalWidth) / 2
            }
          }

          // Draw with proper sizing and transparency
          ctx.globalAlpha = 0.7
          ctx.drawImage(img, finalX, finalY, finalWidth, finalHeight)
          ctx.globalAlpha = 1.0

          console.log(
            `✅ Drew flux overlay at (${finalX}, ${finalY}) size ${finalWidth}x${finalHeight}`,
          )
        }
      })
    }
  } catch (error) {
    console.warn('Could not add flux overlay:', error)
  }

  // Step 5: Draw solar panels with correct scaling
  try {
    console.log('☀️ Drawing solar panels with correct scaling...')

    const panelData = (window as any).currentPanelData
    if (panelData && panelData.length > 0) {
      console.log(`📊 Drawing ${panelData.length} solar panels`)

      panelData.forEach((panel: any, index: number) => {
        // Draw panel polygon
        ctx.beginPath()
        panel.path.forEach((point: any, i: number) => {
          const coords = latLngToCanvas(point.lat, point.lng)
          if (i === 0) {
            ctx.moveTo(coords.x, coords.y)
          } else {
            ctx.lineTo(coords.x, coords.y)
          }
        })
        ctx.closePath()

        // Fill with energy-based color
        ctx.fillStyle = panel.color
        ctx.globalAlpha = 0.9
        ctx.fill()

        // Add stroke
        ctx.strokeStyle = '#B0BEC5'
        ctx.lineWidth = 1
        ctx.globalAlpha = 1.0
        ctx.stroke()
      })

      console.log(`✅ Drew ${panelData.length} solar panels with correct coordinates`)
    } else {
      console.log('⚠️ No panel data available')
    }
  } catch (error) {
    console.warn('Could not add solar panels:', error)
  }

  return canvas.toDataURL('image/png', 0.95)
}
import type { SolarPanelConfig, LatLng } from '@/services/solar'
import { createPalette, normalize, rgbToColor } from '@/services/visualize'
import { panelsPalette } from '@/services/colors'

/**
 * Draws solar panels from a given config to the Google Map instance.
 *
 * @param config The solar panel configuration to render
 * @param solarPanels Full list of all possible solar panels (from building.solarPotential.solarPanels)
 * @param roofSegments List of roof segment stats from the building
 * @param panelWidth Width of a panel in meters
 * @param panelHeight Height of a panel in meters
 * @param map Google Maps instance
 * @param geometry Google Maps geometry library
 * @returns Array of google.maps.Polygon objects representing the panels
 */
export function drawSolarPanels({
  config,
  solarPanels,
  roofSegments,
  panelWidth,
  panelHeight,
  map,
  geometry,
}: {
  config: SolarPanelConfig
  solarPanels: {
    center: LatLng
    orientation: 'LANDSCAPE' | 'PORTRAIT'
    segmentIndex: number
    yearlyEnergyDcKwh: number
  }[]
  roofSegments: {
    azimuthDegrees: number
    pitchDegrees: number
    center: LatLng
    planeHeightAtCenterMeters: number
  }[]
  panelWidth: number
  panelHeight: number
  map: google.maps.Map
  geometry: typeof google.maps.geometry
}): google.maps.Polygon[] {
  const palette = createPalette(panelsPalette).map(rgbToColor)
  const maxEnergy = solarPanels[0]?.yearlyEnergyDcKwh || 1
  const minEnergy = solarPanels[solarPanels.length - 1]?.yearlyEnergyDcKwh || 0

  const w = panelWidth / 2
  const h = panelHeight / 2
  const rect = [
    { x: +w, y: +h },
    { x: +w, y: -h },
    { x: -w, y: -h },
    { x: -w, y: +h },
    { x: +w, y: +h },
  ]

  const polygons: google.maps.Polygon[] = []
  const panelData: Array<{
    path: google.maps.LatLngLiteral[]
    energy: number
    color: string
    segmentIndex: number
  }> = []

  for (let i = 0; i < config.panelsCount; i++) {
    const panel = solarPanels[i]
    if (!panel) continue

    const segment = roofSegments[panel.segmentIndex]
    const azimuth = segment.azimuthDegrees
    const orientation = panel.orientation === 'PORTRAIT' ? 90 : 0
    const colorIdx = Math.round(normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255)
    const fillColor = palette[colorIdx]

    // Create the polygon path for both display and capture
    const polygonPath = rect.map(({ x, y }) =>
      geometry.spherical.computeOffset(
        { lat: panel.center.latitude, lng: panel.center.longitude },
        Math.sqrt(x * x + y * y),
        Math.atan2(y, x) * (180 / Math.PI) + orientation + azimuth,
      ),
    )

    const panelPolygon = new google.maps.Polygon({
      paths: polygonPath,
      strokeColor: '#B0BEC5',
      strokeOpacity: 0.9,
      strokeWeight: 1,
      fillColor: fillColor,
      fillOpacity: 0.9,
      map,
    })

    polygons.push(panelPolygon)

    // Store panel data for layer system (convert LatLng objects to literals)
    panelData.push({
      path: polygonPath.map((latLng) => latLng.toJSON()),
      energy: panel.yearlyEnergyDcKwh,
      color: fillColor,
      segmentIndex: panel.segmentIndex,
    })
  }

  // Store panel geometry data globally for the capture system
  // This is safe and won't break anything if the layer system isn't loaded
  try {
    ;(window as any).currentPanelData = panelData
    console.log(`☀️ Stored ${config.panelsCount} panel geometries for capture system`)

    // Try to register layers if the function is available
    // Using dynamic import to avoid circular dependencies
    import('@/services/mapService')
      .then(({ registerMapLayer }) => {
        // Register all panels as a single layer
        registerMapLayer('all_solar_panels', polygons[0] as any, {
          type: 'polygon',
          opacity: 0.9,
          zIndex: 15,
          description: `All solar panels (${config.panelsCount} panels total)`,
        })

        // Register efficiency-based groups
        const highEfficiencyPanels = panelData.filter((p) => p.energy > maxEnergy * 0.8)
        const mediumEfficiencyPanels = panelData.filter(
          (p) => p.energy > maxEnergy * 0.5 && p.energy <= maxEnergy * 0.8,
        )
        const lowEfficiencyPanels = panelData.filter((p) => p.energy <= maxEnergy * 0.5)

        if (highEfficiencyPanels.length > 0) {
          registerMapLayer('panels_high_efficiency', polygons[0] as any, {
            type: 'polygon',
            opacity: 0.9,
            zIndex: 20,
            description: `High efficiency panels (${highEfficiencyPanels.length} panels, >80% max energy)`,
          })
        }

        if (mediumEfficiencyPanels.length > 0) {
          registerMapLayer('panels_medium_efficiency', polygons[0] as any, {
            type: 'polygon',
            opacity: 0.9,
            zIndex: 19,
            description: `Medium efficiency panels (${mediumEfficiencyPanels.length} panels, 50-80% max energy)`,
          })
        }

        if (lowEfficiencyPanels.length > 0) {
          registerMapLayer('panels_low_efficiency', polygons[0] as any, {
            type: 'polygon',
            opacity: 0.9,
            zIndex: 18,
            description: `Lower efficiency panels (${lowEfficiencyPanels.length} panels, <50% max energy)`,
          })
        }

        console.log(`📋 Registered panel layers for capture system`)
      })
      .catch((error) => {
        // Layer system not available, that's fine
        console.log('Layer system not available, panels stored for basic capture')
      })
  } catch (error) {
    // If anything fails, just continue - the core functionality still works
    console.warn('Could not register panel layers:', error)
  }

  return polygons
}

/**
 * Enhanced function to draw panels with custom styling for capture
 * This is separate so it doesn't interfere with the main drawing function
 */
export const drawPanelsForCapture = (
  ctx: CanvasRenderingContext2D,
  panelData: Array<{
    path: google.maps.LatLngLiteral[]
    energy: number
    color: string
    segmentIndex: number
  }>,
  bounds: google.maps.LatLngBounds,
  canvasSize: { width: number; height: number },
  options: {
    strokeColor?: string
    strokeWidth?: number
    showEnergyGradient?: boolean
    opacity?: number
  } = {},
) => {
  const ne = bounds.getNorthEast()
  const sw = bounds.getSouthWest()

  // Convert lat/lng to canvas coordinates
  const toCanvasCoords = (lat: number, lng: number) => {
    const x = ((lng - sw.lng()) / (ne.lng() - sw.lng())) * canvasSize.width
    const y = ((ne.lat() - lat) / (ne.lat() - sw.lat())) * canvasSize.height
    return { x, y }
  }

  panelData.forEach((panel, index) => {
    // Draw panel polygon
    ctx.beginPath()
    panel.path.forEach((point, i) => {
      const coords = toCanvasCoords(point.lat, point.lng)
      if (i === 0) {
        ctx.moveTo(coords.x, coords.y)
      } else {
        ctx.lineTo(coords.x, coords.y)
      }
    })
    ctx.closePath()

    // Fill with energy-based color
    ctx.fillStyle = panel.color
    ctx.globalAlpha = options.opacity ?? 0.9
    ctx.fill()

    // Add stroke if specified
    if (options.strokeColor) {
      ctx.strokeStyle = options.strokeColor
      ctx.lineWidth = options.strokeWidth ?? 1
      ctx.globalAlpha = 1.0
      ctx.stroke()
    }
  })

  ctx.globalAlpha = 1.0
}

/**
 * Utility to get panel data for capture system
 */
export const getCurrentPanelData = () => {
  return (window as any).currentPanelData || []
}
