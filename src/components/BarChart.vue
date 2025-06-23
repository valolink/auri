<template>
  <Bar ref="chartRef" :options="options" :data="data" />
  <button @click="downloadChartImage">Download Chart as Image</button>
</template>

<script setup lang="ts">
import { useAppState } from '@/useAppState'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { downloadChartImage } from '@/services/chartUtils'
const options = {
  responsive: true,
}

const data = {
  labels: [],
  datasets: [],
}

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)
const { chartRef } = useAppState()
</script>
