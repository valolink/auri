<template>
  <Bar id="my-chart-id" :options="chartOptions" :data="chartData" />
</template>

<script lang="ts" setup>
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

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const { chartData } = useAppState()

const chartOptions = reactive({
  responsive: true,
})
</script>

<script lang="ts">
export function updateChartData(yearlyEnergy: number, distribution: number[]) {
  return distribution.map((month) => month * yearlyEnergy)
}
</script>
