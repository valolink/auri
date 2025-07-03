// pdfService.ts
import { useAppState } from '@/useAppState'
import { useCharts } from '@/services/useCharts'
import { calculateZoomFromRadius, captureMapWithProperSizing } from './mapService'
const { getChartImage } = useCharts()
const { ajaxUrl, settings, input, output, buildingData, mapInstance } = useAppState()

export const requestPdf = async function () {
  const formData = new FormData()
  formData.append('action', 'pdf_report')

  // Basic info
  formData.append('versionNumber', '1.0') // Not in your data, using default
  formData.append('currentDate', new Date().toLocaleDateString('fi-FI'))
  formData.append('address', input?.address || '')

  // Location data - these don't seem to be in your current state structure
  formData.append('lat', '') // Not found in your data
  formData.append('lng', '') // Not found in your data

  // Scores - these don't seem to exist in your output structure
  formData.append('scoreProfitability', '0') // Not found in your output
  formData.append('scoreProduction', '0') // Not found in your output

  // System specifications - mapping to your actual output structure
  formData.append('capacityKwp', output?.active?.capacityKwp?.toString() || '0')
  formData.append('panelsCount', output?.active?.panelsCount?.toString() || '0')
  formData.append('yearlyEnergyDcKwh', output?.active?.yearlyEnergyDcKwh?.toString() || '0')
  formData.append('installationCostEuros', output?.active?.installationCostEuros?.toString() || '0')
  formData.append('yearlyCarbonOffset', output?.active?.yearlyCarbonOffset?.toString() || '0')

  // Calculate maintenance costs per year from your data
  const maintenanceCostPerYear =
    output?.active?.maintenanceCostsPerLifeSpan && settings?.installationLifeSpan?.value
      ? (output.active.maintenanceCostsPerLifeSpan / settings.installationLifeSpan.value).toString()
      : '0'
  formData.append('maintenanceCostsPerYear', maintenanceCostPerYear)

  // Profitability data - mapping to your actual output structure
  formData.append('paybackYears', output?.active?.paybackYears?.toString() || '0')
  formData.append(
    'averageYearlySavingsEuros',
    output?.active?.averageYearlySavingsEuros?.toString() || '0',
  )
  formData.append('lcoeSntkPerKwh', output?.active?.lcoeSntPerKwh?.toString() || '0') // Note: your field is lcoeSntPerKwh, not lcoeSntkPerKwh

  // These need to be calculated or aren't in your current output
  formData.append('netPresentValueEuros', '0') // Not found in your output
  formData.append('internalRateOfReturn', '0') // Not found in your output

  // Calculation parameters - mapping to your settings structure
  formData.append('energyPriceSnt', settings?.energyPriceSnt?.value?.toString() || '0')
  formData.append('transmissionPriceSnt', settings?.transmissionPriceSnt?.value?.toString() || '0')
  formData.append('electricityTaxSnt', settings?.electricityTax?.value?.toString() || '0') // Note: your field is electricityTax, not electricityTaxSnt
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
  formData.append('panelCapacityWatts', settings?.panelCapacityWatts?.value?.toString() || '0')
  formData.append(
    'installationCostPerKwp',
    settings?.installationCostPerKwp?.value?.toString() || '0',
  )

  // Building data - these don't seem to be in your current structure
  formData.append('pitchDegrees', '0') // Not found in your data
  formData.append('azimuthDegrees', '0') // Not found in your data

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
