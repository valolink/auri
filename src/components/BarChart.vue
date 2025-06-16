<template>
  <Bar ref="chartRef" :options="options" :data="data" />
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
