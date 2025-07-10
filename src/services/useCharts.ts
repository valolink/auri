// services/useCharts.ts
import { useAppState } from '@/useAppState'
import type { Chart, ChartDataset } from 'chart.js'

export function useCharts() {
  const { chartRefs } = useAppState()

  const getChart = (chartId: string): Chart | undefined => {
    console.log('Getting chart:', chartId, chartRefs[chartId]?.value) // Add this debug line
    return chartRefs[chartId]?.value as Chart | undefined
  }

  const updateChart = (chartId: string, labels: string[], datasets: ChartDataset[]) => {
    const chartInstance = getChart(chartId)
    if (chartInstance) {
      console.log(chartInstance.data)

      // Update labels
      chartInstance.data.labels = labels

      // Update datasets more carefully
      datasets.forEach((newDataset, datasetIndex) => {
        if (chartInstance.data.datasets[datasetIndex]) {
          // Update existing dataset
          Object.assign(chartInstance.data.datasets[datasetIndex], newDataset)
        } else {
          // Add new dataset
          chartInstance.data.datasets.push(newDataset)
        }
      })

      // Remove extra datasets if any
      chartInstance.data.datasets.splice(datasets.length)

      chartInstance.update()
    } else {
      console.warn(`Chart ${chartId} not available`)
    }
  }

  const downloadChart = (chartId: string, filename: string = 'chart.png') => {
    const chartInstance = getChart(chartId)
    if (chartInstance) {
      const base64Image = chartInstance.toBase64Image()
      const link = document.createElement('a')
      link.href = base64Image
      link.download = filename
      link.click()
    }
  }

  const getChartImage = (chartId: string): string | undefined => {
    const chartInstance = getChart(chartId)
    if (chartInstance) {
      const originalWidth = chartInstance.width
      const originalHeight = chartInstance.height
      const originalPixelRatio = chartInstance.options.devicePixelRatio

      chartInstance.options.devicePixelRatio = 2
      chartInstance.resize(600, 300)
      chartInstance.update('none')

      const base64Image = chartInstance.toBase64Image('image/png', 1.0)

      chartInstance.options.devicePixelRatio = originalPixelRatio
      chartInstance.resize(originalWidth, originalHeight)
      chartInstance.update('none')

      return base64Image
    }
  }
  const resetChart = (chartId: string) => {
    const chartInstance = getChart(chartId)
    if (chartInstance) {
      // Reset all datasets' data to 0
      chartInstance.data.datasets.forEach((dataset) => {
        if (dataset.data && Array.isArray(dataset.data)) {
          dataset.data = dataset.data.map(() => 0)
        }
      })

      chartInstance.update()
    } else {
      console.warn(`Chart ${chartId} not available`)
    }
  }

  return {
    updateChart,
    downloadChart,
    getChartImage,
    resetChart,
  }
}
