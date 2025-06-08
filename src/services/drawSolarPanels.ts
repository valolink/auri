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

  for (let i = 0; i < config.panelsCount; i++) {
    const panel = solarPanels[i]
    if (!panel) continue

    const segment = roofSegments[panel.segmentIndex]
    const azimuth = segment.azimuthDegrees
    const orientation = panel.orientation === 'PORTRAIT' ? 90 : 0
    const colorIdx = Math.round(normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255)

    const panelPolygon = new google.maps.Polygon({
      paths: rect.map(({ x, y }) =>
        geometry.spherical.computeOffset(
          { lat: panel.center.latitude, lng: panel.center.longitude },
          Math.sqrt(x * x + y * y),
          Math.atan2(y, x) * (180 / Math.PI) + orientation + azimuth,
        ),
      ),
      strokeColor: '#B0BEC5',
      strokeOpacity: 0.9,
      strokeWeight: 1,
      fillColor: palette[colorIdx],
      fillOpacity: 0.9,
      map,
    })

    polygons.push(panelPolygon)
  }

  return polygons
}
