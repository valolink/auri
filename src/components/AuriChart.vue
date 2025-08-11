<!-- AuriChart.vue -->
<template>
  <div class="chart-container">
    <canvas :ref="setCanvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, markRaw, type ComponentPublicInstance } from 'vue'
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

const setCanvasRef = (el: Element | ComponentPublicInstance | null) => {
  if (el && el instanceof HTMLCanvasElement) {
    canvasRef.value = el
  }
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
            grid: {
              color: function (context) {
                if (context.tick.value == 0 && props.chartId == 'savings') {
                  return 'rgba(0,0,0,0.6)'
                } else {
                  return 'rgba(0,0,0,0.1)'
                }
              },
            },
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
  margin: 0 auto;
  width: 100%;
  max-height: 350px;
}
</style>
