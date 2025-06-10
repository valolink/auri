import type { Chart } from 'chart.js'
import { useAppState } from '@/useAppState'

export function updateChartData(yearlyEnergy: number, distribution: number[]) {
  const { chartRef } = useAppState()
  const chartInstance = chartRef.value?.chart as Chart<'bar'> | undefined

  if (chartInstance) {
    // Modify Chart.js internal data directly
    chartInstance.data.datasets[0].data = distribution.map((month) => (month * yearlyEnergy) / 100)
    chartInstance.update()
    console.log('Chart updated with:', chartInstance.data.datasets[0].data)
  } else {
    console.warn('Chart instance not available')
  }
}
