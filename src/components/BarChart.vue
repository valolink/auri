<template>
  <Bar ref="chartRef" :options="options" :data="data" />
</template>

<script setup lang="ts">
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

const options = reactive({
  responsive: true,
})

const data = reactive({
  labels: [],
  datasets: [],
})

import { useAppState } from '@/useAppState'
import { reactive } from 'vue'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const { chartRef } = useAppState()
</script>
