<template>
  <Bar ref="chartRef" :options="chartOptions" :data="chartData" />
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

import { useAppState } from '@/useAppState'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const { chartRef, chartData, chartOptions } = useAppState()
</script>
