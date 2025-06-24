import type { Chart } from 'chart.js'
import { useAppState } from '@/useAppState'

const { output, input, chartRef } = useAppState()

export function updateChartData(
  yearlyEnergy: number = output.active.yearlyEnergyDcKwh,
  distribution: number[] = output.monthlyDistribution,
  yearlyUsage: number = input.yearlyEnergyUsageKwh.value,
  buildingProfile: number[] = JSON.parse(input.buildingType.value),
) {
  const chartInstance = chartRef.value?.chart as Chart<'bar'> | undefined

  if (chartInstance) {
    // Modify Chart.js internal data directly
    chartInstance.data.labels = [
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
    ]
    chartInstance.data.datasets.length = 0
    chartInstance.data.datasets.push({
      label: 'Paneelien teho',
      backgroundColor: '#18a058',
      data: distribution.map((month) => (month * yearlyEnergy) / 100),
    })
    chartInstance.data.datasets.push({
      label: 'Sähkön kulutus',
      backgroundColor: 'rgb(233, 134, 134)',
      data: buildingProfile.map((month) => month * yearlyUsage),
    })
    chartInstance.update()
    console.log('Chart updated with:', chartInstance.data.datasets[0].data)
  } else {
    console.warn('Chart instance not available')
  }
}

export function downloadChartImage() {
  const chartInstance = chartRef.value?.chart as Chart<'bar'> | undefined
  if (chartInstance) {
    const base64Image = chartInstance.toBase64Image()

    const link = document.createElement('a')
    link.href = base64Image
    link.download = 'bar-chart.png'
    link.click()
  }
}

export function chartImage(): string | undefined {
  const chartInstance = chartRef.value?.chart as Chart<'bar'> | undefined
  if (chartInstance) {
    // Store original settings
    const originalWidth = chartInstance.width
    const originalHeight = chartInstance.height
    const originalPixelRatio = chartInstance.options.devicePixelRatio

    // Set high resolution (2x) and desired display size
    chartInstance.options.devicePixelRatio = 2

    // Resize to desired display dimensions (750x375)
    // The actual canvas will be 1500x750 due to devicePixelRatio = 2
    chartInstance.resize(600, 300)

    // Update the chart to apply the new devicePixelRatio
    chartInstance.update('none')

    // Generate the high-res image
    const base64Image = chartInstance.toBase64Image('image/png', 1.0)

    // Restore original settings
    chartInstance.options.devicePixelRatio = originalPixelRatio
    chartInstance.resize(originalWidth, originalHeight)
    chartInstance.update('none')

    return base64Image
  }
}
