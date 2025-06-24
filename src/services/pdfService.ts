import { useAppState } from '@/useAppState'
import { chartImage } from '@/services/chartUtils'

const { ajaxUrl, settings, input, output, buildingData } = useAppState()

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

  // Handle images
  try {
    // Solar chart image
    const solarChartUrl = chartImage()
    if (solarChartUrl) {
      const solarRes = await fetch(solarChartUrl)
      const solarBlob = await solarRes.blob()
      formData.append('solarChartImage', solarBlob, 'solarChart.png')
    }

    // Heat map image (if you have a function to generate it)
    // const heatMapUrl = heatMapImage() // You'll need to implement this
    // if (heatMapUrl) {
    //   const heatRes = await fetch(heatMapUrl)
    //   const heatBlob = await heatRes.blob()
    //   formData.append('heatMapImage', heatBlob, 'heatMap.png')
    // }

    // Lifecycle chart image (if you have a function to generate it)
    // const lifecycleChartUrl = lifecycleChartImage() // You'll need to implement this
    // if (lifecycleChartUrl) {
    //   const lifecycleRes = await fetch(lifecycleChartUrl)
    //   const lifecycleBlob = await lifecycleRes.blob()
    //   formData.append('lifecycleChartImage', lifecycleBlob, 'lifecycleChart.png')
    // }
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
