<template>
  <Bar :ref="setChartRef" :options="chartOptions" :data="chartData" />
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
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
<!-- <template> -->
<!--   <Bar ref="chartRef" :options="options" :data="data" /> -->
<!-- </template> -->
<!---->
<!-- <script setup lang="ts"> -->
<!-- import { useAppState } from '@/useAppState' -->
<!-- import { Bar } from 'vue-chartjs' -->
<!-- import { -->
<!--   Chart as ChartJS, -->
<!--   Title, -->
<!--   Tooltip, -->
<!--   Legend, -->
<!--   BarElement, -->
<!--   CategoryScale, -->
<!--   LinearScale, -->
<!-- } from 'chart.js' -->
<!-- const options = { -->
<!--   responsive: true, -->
<!-- } -->
<!---->
<!-- const data = { -->
<!--   labels: [], -->
<!--   datasets: [], -->
<!-- } -->
<!---->
<!-- ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale) -->
<!-- const { chartRef } = useAppState() -->
<!-- </script> -->
