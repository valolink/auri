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
