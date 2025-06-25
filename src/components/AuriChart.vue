<template>
  <div class="chart-container">
    <Chart :ref="setChartRef" :type="chartType" :options="chartOptions" :data="chartData" />
  </div>
</template>

<script setup lang="ts">
import { Chart as ChartComponent } from 'vue-chartjs'
import { computed } from 'vue'
import type { ChartOptions, ChartData } from 'chart.js'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface Props {
  chartId: string
  options?: Partial<ChartOptions<'bar'>>
  data?: ChartData<'bar'>
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({}),
  data: () => ({ labels: [], datasets: [] }),
})

const emit = defineEmits<{
  chartReady: [chartId: string, chartRef: any]
}>()

const chartOptions = computed(() => ({
  responsive: true,
  ...props.options,
}))

const chartData = computed(() => props.data)

const setChartRef = (el: any) => {
  if (el) {
    emit('chartReady', props.chartId, el)
  }
}
</script>

<style scoped>
.chart-container {
  max-width: 600px;
  margin: 0 auto; /* Center the chart */
}
</style>
