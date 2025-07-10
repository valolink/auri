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
      console.log(`Chart ${chartId} updated with:`, chartInstance.data.datasets[0]?.data)
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

  return {
    updateChart,
    downloadChart,
    getChartImage,
  }
}
// // services/useCharts.ts
// import { useAppState } from '@/useAppState'
// import type { Chart } from 'chart.js'
//
// export function useCharts() {
//   const { chartRefs } = useAppState()
//
//   const getChart = (chartId: string): Chart<'bar'> | undefined => {
//     return chartRefs[chartId]?.value?.chart as Chart<'bar'> | undefined
//   }
//
//   const updateChart = (chartId: string, labels: string[], datasets: any[]) => {
//     const chartInstance = getChart(chartId)
//     if (chartInstance) {
//       chartInstance.data.labels = labels
//       chartInstance.data.datasets.length = 0
//       chartInstance.data.datasets.push(...datasets)
//       chartInstance.update()
//       console.log(`Chart ${chartId} updated with:`, chartInstance.data.datasets[0]?.data)
//     } else {
//       console.warn(`Chart ${chartId} not available`)
//     }
//   }
//
//   const downloadChart = (chartId: string, filename: string = 'chart.png') => {
//     const chartInstance = getChart(chartId)
//     if (chartInstance) {
//       const base64Image = chartInstance.toBase64Image()
//       const link = document.createElement('a')
//       link.href = base64Image
//       link.download = filename
//       link.click()
//     }
//   }
//
//   const getChartImage = (chartId: string): string | undefined => {
//     const chartInstance = getChart(chartId)
//     if (chartInstance) {
//       const originalWidth = chartInstance.width
//       const originalHeight = chartInstance.height
//       const originalPixelRatio = chartInstance.options.devicePixelRatio
//
//       chartInstance.options.devicePixelRatio = 2
//       chartInstance.resize(600, 300)
//       chartInstance.update('none')
//
//       const base64Image = chartInstance.toBase64Image('image/png', 1.0)
//
//       chartInstance.options.devicePixelRatio = originalPixelRatio
//       chartInstance.resize(originalWidth, originalHeight)
//       chartInstance.update('none')
//
//       return base64Image
//     }
//   }
//
//   return {
//     updateChart,
//     downloadChart,
//     getChartImage,
//   }
// }
