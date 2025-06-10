<template>
  <Bar ref="chart" :options="chartOptions" :data="chartData" />
</template>

<script lang="ts">
import { reactive } from 'vue'
import { Bar } from 'vue-chartjs'
import { useAppState } from '@/useAppState'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import type { ChartOptions, Chart } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const { chartData } = useAppState()

const chartOptions: ChartOptions = reactive({
  responsive: true,
})

export function updatesChartData(yearlyEnergy: number, distribution: number[]) {
  chartData.datasets[0].data = distribution.map((month) => month * yearlyEnergy)
  console.log('updated chartData:', chartData.datasets[0].data)
  const solarPowerChart = this.$refs.chart
  const chart = solarPowerChart.value?.chart as Chart<'bar'> | undefined
  if (chart) {
    chart.update()
  }
}
export default {
  name: 'BarChart',
  components: { Bar },
  data() {
    return {
      chartData: chartData,
      chartOptions: chartOptions,
    }
  },
}
</script>
