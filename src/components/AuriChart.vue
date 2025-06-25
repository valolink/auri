<!-- AuriChart.vue -->
<template>
  <div class="chart-container">
    <canvas :ref="setCanvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, markRaw } from 'vue'
import {
  Chart,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarController,
  LineController,
} from 'chart.js'

Chart.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarController,
  LineController,
)

interface Props {
  chartId: string
  chartType?: 'bar' | 'line' // Add this prop
}

const props = withDefaults(defineProps<Props>(), {
  chartType: 'bar', // Default to bar
})

const emit = defineEmits<{
  chartReady: [chartId: string, chart: Chart]
}>()

const canvasRef = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const setCanvasRef = (el: HTMLCanvasElement) => {
  canvasRef.value = el
}

onMounted(() => {
  if (canvasRef.value) {
    chart = new Chart(canvasRef.value, {
      type: props.chartType, // Use the prop instead of hardcoded 'bar'
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
          },
          tooltip: {
            enabled: true,
          },
        },
        scales: {
          x: {
            type: 'category',
          },
          y: {
            type: 'linear',
          },
        },
        layout: {
          padding: 0,
        },
      },
    })

    emit('chartReady', props.chartId, markRaw(chart))
  }
})

onUnmounted(() => {
  chart?.destroy()
})
</script>

<style scoped>
.chart-container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
