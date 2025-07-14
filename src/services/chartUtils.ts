// chartUtils.ts
import { useAppState } from '@/useAppState'
import { useCharts } from '@/services/useCharts'
import { calculateCashFlows, calculateBasicFinancials } from './cashFlowUtils' // Import shared utilities
import type { SolarCalculationResult } from '@/types'

const { output, input, settings } = useAppState()
const { resetChart, updateChart } = useCharts()

export const resetCharts = () => {
  resetChart('energy')
  resetChart('savings')
}

// Energy Chart Functions
export function updateEnergyChart(
  yearlyEnergy: number = output.active.yearlyEnergyDcKwh,
  distribution: number[] = output.monthlyDistribution,
  yearlyUsage: number = input.yearlyEnergyUsageKwh.value,
  buildingProfile: number[] = input.customProfile.active
    ? input.normalizedDistribution
    : JSON.parse(input.buildingType?.value),
) {
  const labels = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

  const datasets = [
    {
      label: 'Paneelien teho',
      backgroundColor: '#18a058',
      data: distribution.map((month) => (month * yearlyEnergy) / 100),
    },
    {
      label: 'Sähkön kulutus',
      backgroundColor: 'rgb(233, 134, 134)',
      data: buildingProfile.map((month) => month * yearlyUsage),
    },
  ]

  updateChart('energy', labels, datasets)
}

function calculateLifecycleSavings(config: SolarCalculationResult): number[] {
  // Use shared utility functions for consistent calculations
  const basicFinancials = calculateBasicFinancials({
    panelsCount: config.panelsCount,
    yearlyEnergyDcKwh: config.yearlyEnergyDcKwh,
  })

  // Get settings values
  const installationLifeSpan = Number(settings.installationLifeSpan.value)
  const efficiencyDepreciationFactor = Number(settings.efficiencyDepreciationFactor.value) / 100
  const costIncreaseFactor = Number(settings.costIncreaseFactor.value) / 100
  const inverterReplacementCostFactor = Number(settings.inverterReplacementCostFactor.value) / 100

  // Use the shared cash flow calculation
  const { netCashFlowCumulative } = calculateCashFlows(
    basicFinancials.installationCostEuros,
    basicFinancials.savingsYear1,
    basicFinancials.maintenanceCostsPerYear,
    installationLifeSpan,
    efficiencyDepreciationFactor,
    costIncreaseFactor,
    inverterReplacementCostFactor,
  )

  // Ensure we have 30 data points for the chart
  const chartData = [...netCashFlowCumulative]
  while (chartData.length < 30) {
    chartData.push(chartData[chartData.length - 1] || 0)
  }

  return chartData.slice(0, 30)
}

export function updateSavingsChart() {
  const cumulativeSavings = calculateLifecycleSavings(output.active)
  const currentYear = new Date().getFullYear()
  const labels = Array.from({ length: 30 }, (_, i) => (currentYear + i + 1).toString())

  // Create datasets that overlap at crossover points
  const negativeData = cumulativeSavings.map((value, index) => {
    if (value < 0) return value
    // Include the first positive value to connect the line
    if (index > 0 && cumulativeSavings[index - 1] < 0) return value
    return null
  })

  const positiveData = cumulativeSavings.map((value, index) => {
    if (value >= 0) return value
    // Include the last negative value to connect the line
    if (index < cumulativeSavings.length - 1 && cumulativeSavings[index + 1] >= 0) return value
    return null
  })

  const datasets = [
    {
      label: 'Elinkaarisäästöt',
      data: positiveData,
      type: 'line' as const,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      pointBackgroundColor: positiveData.map((val) =>
        val !== null && val >= 0 ? '#10b981' : 'transparent',
      ),
      pointBorderColor: positiveData.map((val) =>
        val !== null && val >= 0 ? '#059669' : 'transparent',
      ),
      pointRadius: positiveData.map((val) => (val !== null && val >= 0 ? 4 : 0)),
      order: 3,
    },
    {
      label: '',
      data: negativeData,
      type: 'line' as const,
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 2,
      fill: false,
      tension: 0.1,
      pointBackgroundColor: negativeData.map((val) =>
        val !== null && val < 0 ? '#ef4444' : 'transparent',
      ),
      pointBorderColor: negativeData.map((val) =>
        val !== null && val < 0 ? '#dc2626' : 'transparent',
      ),
      pointRadius: negativeData.map((val) => (val !== null && val < 0 ? 4 : 0)),
      order: 2,
    },
  ]

  updateChart('savings', labels, datasets)
}
