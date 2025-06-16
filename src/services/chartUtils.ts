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
