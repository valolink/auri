// mapService.ts
import { Loader } from '@googlemaps/js-api-loader'
import { useAppState } from '@/useAppState'
// Internal state
let geometry: typeof google.maps.geometry
let overlay: google.maps.GroundOverlay | null = null

const { mapRef, mapInstance, output } = useAppState()

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
 * Can work with either map container size OR target image size
 */
export const calculateZoomFromRadius = (
  radiusMeters: number,
  paddingFactor: number = 1,
  targetSize?: { width: number; height: number }, // NEW: Optional target size
  buildingCenter = output.buildingCenter,
): number => {
  // Calculate the effective radius we need to show (building + padding)
  const effectiveRadius = radiusMeters * paddingFactor
  const diameterMeters = effectiveRadius * 2

  // Use target size if provided, otherwise use map container size
  const containerSize = targetSize || {
    width: mapRef.value?.offsetWidth || 400,
    height: mapRef.value?.offsetHeight || 400,
  }
  console.log('containerSize', containerSize)
  // Use the smaller dimension to ensure the area fits in both width and height
  const minDimension = Math.min(containerSize.width, containerSize.height)

  // Google Maps zoom calculation:
  // At zoom level z, the world is 256 * 2^z pixels wide
  // At the equator, this represents 40,075,016.686 meters (Earth's circumference)
  // At latitude lat, this is scaled by cos(lat * π/180)

  const earthCircumference = 40075016.686 // meters
  const latitudeRadians = (buildingCenter.lat * Math.PI) / 180
  const metersPerPixelAtZoom0 = (earthCircumference * Math.cos(latitudeRadians)) / 256

  // Calculate required meters per pixel to fit the diameter in the container
  const requiredMetersPerPixel = diameterMeters / minDimension

  // Calculate zoom level: metersPerPixel = metersPerPixelAtZoom0 / (2^zoom)
  // So: zoom = log2(metersPerPixelAtZoom0 / requiredMetersPerPixel)
  const calculatedZoom = Math.log2(metersPerPixelAtZoom0 / requiredMetersPerPixel)

  // Round to nearest integer and constrain to reasonable bounds
  const zoom = Math.max(8, Math.min(21, Math.floor(calculatedZoom)))

  console.log(`🔍 Zoom calculation:`)
  console.log(`  Building radius: ${radiusMeters}m`)
  console.log(`  Effective diameter: ${diameterMeters}m`)
  console.log(
    `  Container size: ${minDimension}px (${containerSize.width}x${containerSize.height})`,
  )
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
    zoom = calculateZoomFromRadius(radiusMeters, 1.0)
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
 * Modified capture function that calculates proper zoom for the image
 * regardless of current map zoom level
 */
export const captureMapWithProperSizing = async (
  options: MapScreenshotOptions & {
    center?: google.maps.LatLngLiteral
    radiusMeters?: number
  } = {},
): Promise<string> => {
  if (!mapInstance.value || !mapRef.value) {
    throw new Error('Map not initialized')
  }

  // Use provided center or current map center
  const targetCenter = options.center || mapInstance.value.getCenter()!.toJSON()
  const padding = 1.4
  // Calculate proper zoom for the image based on building radius
  const size = { width: 1000, height: 800 }
  const targetZoom = calculateZoomFromRadius(options.radiusMeters, padding, size, targetCenter)

  console.log('🎯 Starting capture with proper zoom calculation...')

  // Step 1: Get base map with CALCULATED zoom (not current zoom)
  const staticMapUrl =
    `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${targetCenter.lat},${targetCenter.lng}` +
    `&zoom=${targetZoom}` + // Use calculated zoom here
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

  // Draw base map
  ctx.drawImage(baseImage, 0, 0, size.width, size.height)

  console.log(`✅ Base map drawn at ${size.width}x${size.height} with zoom ${targetZoom}`)

  // Step 3: Calculate bounds using the same radius-based logic as flux data
  // const imageRadius = options.radiusMeters * padding // Same padding as zoom calculation
  // const { bounds: imageBounds } = calculateMapBounds(targetCenter, targetZoom, size)
  // const imageBounds = {
  //   north: targetCenter.lat + imageRadius / 111320, // 111320 meters per degree lat
  //   south: targetCenter.lat - imageRadius / 111320,
  //   east: targetCenter.lng + imageRadius / (111320 * Math.cos((targetCenter.lat * Math.PI) / 180)),
  //   west: targetCenter.lng - imageRadius / (111320 * Math.cos((targetCenter.lat * Math.PI) / 180)),
  // }
  // Step 3: Calculate bounds using Google Static Maps' exact pixel-to-coordinate conversion
  const scale = Math.pow(2, targetZoom)
  const worldSize = 256 * scale

  // Convert center to world coordinates
  const centerWorldX = ((targetCenter.lng + 180) / 360) * worldSize
  const centerWorldY =
    ((1 -
      Math.log(
        Math.tan((targetCenter.lat * Math.PI) / 180) +
          1 / Math.cos((targetCenter.lat * Math.PI) / 180),
      ) /
        Math.PI) /
      2) *
    worldSize

  // Calculate bounds based on image size
  const halfWidth = size.width / 2
  const halfHeight = size.height / 2

  const northWestWorldX = centerWorldX - halfWidth
  const northWestWorldY = centerWorldY - halfHeight
  const southEastWorldX = centerWorldX + halfWidth
  const southEastWorldY = centerWorldY + halfHeight

  // Convert back to lat/lng
  const west = (northWestWorldX / worldSize) * 360 - 180
  const north =
    (Math.atan(Math.sinh(Math.PI * (1 - 2 * (northWestWorldY / worldSize)))) * 180) / Math.PI
  const east = (southEastWorldX / worldSize) * 360 - 180
  const south =
    (Math.atan(Math.sinh(Math.PI * (1 - 2 * (southEastWorldY / worldSize)))) * 180) / Math.PI

  const imageBounds = { north, south, east, west }

  console.log('🎯 Image bounds calculated from Static Maps projection:', {
    bounds: imageBounds,
    zoom: targetZoom,
    center: targetCenter,
  })
  // Helper function to convert lat/lng to canvas coordinates (using IMAGE bounds)
  const latLngToCanvas = (lat: number, lng: number) => {
    // Calculate basic coordinates
    const baseX = ((lng - imageBounds.west) / (imageBounds.east - imageBounds.west)) * size.width
    const baseY =
      ((imageBounds.north - lat) / (imageBounds.north - imageBounds.south)) * size.height

    // Apply scale correction around the center
    const centerX = size.width / 2
    const centerY = size.height / 2
    const scaleFactor = 1.5 // Since building is 1.5x bigger in map, we need to scale overlays up

    const scaledX = centerX + (baseX - centerX) * scaleFactor
    const scaledY = centerY + (baseY - centerY) * scaleFactor

    return { x: scaledX, y: scaledY }
  }

  // Step 4: Draw overlays using the actual geographic bounds of the flux overlay
  try {
    console.log('🔥 Drawing flux overlay using geographic bounds...')

    // Instead of using DOM positions, get the flux overlay's actual geographic bounds
    // The flux overlay is stored as a GroundOverlay with known bounds
    if (overlay && overlay.getBounds()) {
      const fluxBounds = overlay.getBounds()!
      const fluxNE = fluxBounds.getNorthEast()
      const fluxSW = fluxBounds.getSouthWest()

      console.log(`📍 Flux overlay geographic bounds:`, {
        north: fluxNE.lat(),
        south: fluxSW.lat(),
        east: fluxNE.lng(),
        west: fluxSW.lng(),
      })

      // Get the flux overlay canvas from our layer registry
      const fluxLayer = mapLayers.get('flux_overlay')
      if (fluxLayer && fluxLayer.element instanceof HTMLCanvasElement) {
        const fluxCanvas = fluxLayer.element

        // Map the flux's geographic bounds to our image canvas coordinates
        const canvasLeft =
          ((fluxSW.lng() - imageBounds.west) / (imageBounds.east - imageBounds.west)) * size.width
        const canvasRight =
          ((fluxNE.lng() - imageBounds.west) / (imageBounds.east - imageBounds.west)) * size.width
        const canvasTop =
          ((imageBounds.north - fluxNE.lat()) / (imageBounds.north - imageBounds.south)) *
          size.height
        const canvasBottom =
          ((imageBounds.north - fluxSW.lat()) / (imageBounds.north - imageBounds.south)) *
          size.height

        const canvasWidth = canvasRight - canvasLeft
        const canvasHeight = canvasBottom - canvasTop

        // ADD SCALING FACTOR:
        const scaleFactor = 1.5 // Adjust this to make flux bigger/smaller
        const scaledWidth = canvasWidth * scaleFactor
        const scaledHeight = canvasHeight * scaleFactor
        const scaledLeft = canvasLeft - (scaledWidth - canvasWidth) / 2
        const scaledTop = canvasTop - (scaledHeight - canvasHeight) / 2
        console.log(`🎨 Drawing flux overlay at:`, {
          x: canvasLeft,
          y: canvasTop,
          width: canvasWidth,
          height: canvasHeight,
        })

        // Only draw if the overlay intersects with our image bounds
        if (
          canvasLeft < size.width &&
          canvasRight > 0 &&
          canvasTop < size.height &&
          canvasBottom > 0
        ) {
          ctx.globalAlpha = 0.7
          ctx.drawImage(fluxCanvas, scaledLeft, scaledTop, scaledWidth, scaledHeight)
          ctx.globalAlpha = 1.0
          console.log(`✅ Drew flux overlay using geographic bounds`)
        } else {
          console.log(`⚠️ Flux overlay is outside image bounds`)
        }
      } else {
        console.log(`⚠️ Flux overlay canvas not found in layer registry`)
      }
    } else {
      console.log(`⚠️ No flux overlay with bounds found`)
    }
  } catch (error) {
    console.warn('Could not add flux overlay:', error)
  }

  // Step 5: Draw solar panels using IMAGE coordinates
  try {
    console.log('☀️ Drawing solar panels with image coordinates...')

    const panelData = (window as any).currentPanelData
    if (panelData && panelData.length > 0) {
      panelData.forEach((panel: any) => {
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

        ctx.fillStyle = panel.color
        ctx.globalAlpha = 0.9
        ctx.fill()

        ctx.strokeStyle = '#B0BEC5'
        ctx.lineWidth = 1
        ctx.globalAlpha = 1.0
        ctx.stroke()
      })

      console.log(`✅ Drew ${panelData.length} panels with image coordinates`)
    }
  } catch (error) {
    console.warn('Could not add solar panels:', error)
  }

  return canvas.toDataURL('image/png', 0.95)
}

/**
 * Helper function to calculate map bounds for a given center, zoom, and size
 */
function calculateMapBounds(
  center: google.maps.LatLngLiteral,
  zoom: number,
  size: { width: number; height: number },
): { bounds: { north: number; south: number; east: number; west: number } } {
  // Google Maps calculations
  const scale = Math.pow(2, zoom)
  const worldCoordinate = {
    x: ((center.lng + 180) / 360) * 256 * scale,
    y:
      ((1 -
        Math.log(
          Math.tan((center.lat * Math.PI) / 180) + 1 / Math.cos((center.lat * Math.PI) / 180),
        ) /
          Math.PI) /
        2) *
      256 *
      scale,
  }

  const pixelCoordinate = {
    x: worldCoordinate.x,
    y: worldCoordinate.y,
  }

  const topLeftPixel = {
    x: pixelCoordinate.x - size.width / 2,
    y: pixelCoordinate.y - size.height / 2,
  }

  const bottomRightPixel = {
    x: pixelCoordinate.x + size.width / 2,
    y: pixelCoordinate.y + size.height / 2,
  }

  // Convert back to lat/lng
  const topLeftWorld = {
    x: topLeftPixel.x / (256 * scale),
    y: topLeftPixel.y / (256 * scale),
  }

  const bottomRightWorld = {
    x: bottomRightPixel.x / (256 * scale),
    y: bottomRightPixel.y / (256 * scale),
  }

  const west = topLeftWorld.x * 360 - 180
  const north = (Math.atan(Math.sinh(Math.PI * (1 - 2 * topLeftWorld.y))) * 180) / Math.PI
  const east = bottomRightWorld.x * 360 - 180
  const south = (Math.atan(Math.sinh(Math.PI * (1 - 2 * bottomRightWorld.y))) * 180) / Math.PI

  return {
    bounds: { north, south, east, west },
  }
}

// [Rest of your drawSolarPanels and related functions remain exactly the same]
import type { SolarPanelConfig, LatLng } from '@/services/solar'
import { createPalette, normalize, rgbToColor } from '@/services/visualize'
import { panelsPalette } from '@/services/colors'

/**
 * Draws solar panels from a given config to the Google Map instance.
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
  try {
    ;(window as any).currentPanelData = panelData
    console.log(`☀️ Stored ${config.panelsCount} panel geometries for capture system`)

    // Try to register layers if the function is available
    import('@/services/mapService')
      .then(({ registerMapLayer }) => {
        // Register all panels as a single layer
        registerMapLayer('all_solar_panels', polygons[0] as any, {
          type: 'polygon',
          opacity: 0.9,
          zIndex: 15,
          description: `All solar panels (${config.panelsCount} panels total)`,
        })

        console.log(`📋 Registered panel layers for capture system`)
      })
      .catch((error) => {
        console.log('Layer system not available, panels stored for basic capture')
      })
  } catch (error) {
    console.warn('Could not register panel layers:', error)
  }

  return polygons
}

/**
 * Enhanced function to draw panels with custom styling for capture
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
