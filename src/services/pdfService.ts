// pdfService.ts
import { useAppState } from '@/useAppState'
import { useCharts } from '@/services/useCharts'
import { calculateZoomFromRadius, captureMapWithProperSizing } from './mapService'
const { getChartImage } = useCharts()
const { ajaxUrl, settings, input, output, buildingData, mapInstance } = useAppState()

export const requestPdf = async function () {
  const roundToSignificantFigures = (num, figures = 3) => {
    if (num === 0) return 0
    const magnitude = Math.pow(10, figures - Math.floor(Math.log10(Math.abs(num))) - 1)
    return Math.round(num * magnitude) / magnitude
  }
  const formData = new FormData()
  formData.append('action', 'pdf_report')

  // TODO:
  formData.append('versionNumber', '1.0')
  formData.append('currentDate', new Date().toLocaleDateString('fi-FI'))
  formData.append('address', output.addressFromApi || '')

  formData.append('lat', output.buildingCenter.lat)
  formData.append('lng', output.buildingCenter.lng)
  formData.append('calculationBasis', output.calculationBasis.label)
  formData.append('buildingType', input.buildingTypeLabel)
  formData.append('yearlyEnergyUsageKwh', input.yearlyEnergyUsageKwh.value.toLocaleString())

  formData.append('scoreProfitability', output.active.scoreProfitability)
  formData.append('scoreProduction', output.active.scoreProduction)

  formData.append(
    'capacityKwp',
    roundToSignificantFigures(output.active.capacityKwp).toLocaleString(),
  )
  formData.append('panelsCount', output.active.panelsCount.toLocaleString())
  formData.append(
    'installationCostEuros',
    roundToSignificantFigures(output.active.installationCostEuros).toLocaleString(),
  )
  formData.append(
    'yearlyEnergyDcKwh',
    roundToSignificantFigures(output.active.yearlyEnergyDcKwh).toLocaleString(),
  )
  formData.append(
    'yearlyCarbonOffset',
    roundToSignificantFigures(output.active.yearlyCarbonOffset).toLocaleString(),
  )

  formData.append(
    'maintenanceCostsPerYear',
    roundToSignificantFigures(output.active.maintenanceCostsPerYear).toLocaleString(),
  )

  formData.append('paybackYears', output.active.paybackYears?.toFixed(1) || '0')
  formData.append(
    'averageYearlySavingsEuros',
    roundToSignificantFigures(output.active.averageYearlySavingsEuros).toLocaleString(),
  )
  formData.append('lcoeSntkPerKwh', roundToSignificantFigures(output.active.lcoeSntPerKwh) || '0')
  formData.append(
    'netPresentValueEuros',
    roundToSignificantFigures(output.active.netPresentValueEuros, 3).toLocaleString(),
  )
  formData.append(
    'internalRateOfReturn',
    roundToSignificantFigures(output.active.netPresentValueEuros).toLocaleString(),
  )
  formData.append('energyPriceSnt', roundToSignificantFigures(settings?.energyPriceSnt?.value))
  formData.append(
    'transmissionPriceSnt',
    roundToSignificantFigures(settings?.transmissionPriceSnt?.value),
  )
  formData.append(
    'lcoeSntkPerKwhelectricityTaxSnt',
    roundToSignificantFigures(settings?.electricityTax?.value),
  )
  formData.append('vat', settings?.vat?.value?.toString() || '24')
  formData.append(
    'maintenanceCostFactor',
    settings?.maintenanceCostFactor?.value?.toString() || '0',
  )
  formData.append(
    'efficiencyDepreciationFactor',
    settings?.efficiencyDepreciationFactor?.value?.toString() || '0',
  )
  formData.append('installationLifeSpan', settings?.installationLifeSpan?.value?.toString() || '25')
  formData.append('panelCapacityWatts', settings?.panelCapacityWatts?.value?.toLocaleString())
  formData.append(
    'installationCostPerKwp',
    settings?.installationCostPerKwp?.value?.toString() || '0',
  )

  // Building data - these don't seem to be in your current structure
  formData.append(
    'pitchDegrees',
    Math.round(
      buildingData.building.solarPotential.roofSegmentStats[0].pitchDegrees,
    ).toLocaleString(),
  )
  formData.append(
    'azimuthDegrees',
    Math.round(
      buildingData.building.solarPotential.roofSegmentStats[1].azimuthDegrees,
    ).toLocaleString(),
  )

  formData.append('discountRate', settings?.discountRate?.value?.toString() || '0')
  formData.append('costIncreaseFactor', settings?.costIncreaseFactor?.value?.toString() || '0')
  formData.append('emissionsFactor', settings?.emissionsFactor?.value?.toString() || '0')

  function compressImage(dataUrl, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', quality)) // JPEG instead of PNG
      }
      img.src = dataUrl
    })
  }

  function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }
  // Handle images
  try {
    // Solar chart image
    const solarChartUrl = getChartImage('energy')
    if (solarChartUrl) {
      const solarRes = await fetch(solarChartUrl)
      const solarBlob = await solarRes.blob()
      console.log('📦 Blob comparison:')
      console.log('Chart blob:', solarBlob.size, solarBlob.type)
      formData.append('solarChartImage', solarBlob, 'solarChart.png')
    }

    mapInstance.value.setCenter(output.buildingCenter)
    mapInstance.value.setZoom(calculateZoomFromRadius(output.buildingRadius))

    const mapDataUrl = await captureMapWithProperSizing({
      center: output.buildingCenter,
      radiusMeters: output.buildingRadius, // This is the key missing parameter!
      size: { width: 800, height: 800 },
    })

    const response = await fetch(mapDataUrl)
    // const mapBlob = await response.blob()
    // console.log('Map blob:', mapBlob.size, mapBlob.type)
    const compressedDataUrl = await compressImage(mapDataUrl, 0.8)
    const mapBlob = dataURLtoBlob(compressedDataUrl)
    formData.append('heatMapImage', mapBlob, 'solarMap.png')

    // Check the data URL format
    console.log('🔍 Map data URL details:')
    console.log('- Length:', mapDataUrl.length)
    console.log('- Starts with:', mapDataUrl.substring(0, 50))
    console.log('- Format valid:', mapDataUrl.startsWith('data:image/'))
    const savingsChartUrl = getChartImage('savings')
    if (savingsChartUrl) {
      const savingsRes = await fetch(savingsChartUrl)
      const lifecycleBlob = await savingsRes.blob()
      formData.append('lifecycleChartImage', lifecycleBlob, 'lifecycleChart.png')
    }
  } catch (imageError) {
    console.warn('Image processing error:', imageError)
  }

  try {
    const response = await fetch(ajaxUrl, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      window.open(result.data.file_url, '_blank')
    } else {
      console.error('PDF generation failed:', result.data?.message)
    }
  } catch (error) {
    console.error('Fetch error:', error)
  }
}
