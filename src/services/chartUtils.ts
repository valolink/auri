// chartUtils.ts
import { useAppState } from '@/useAppState'
import { useCharts } from '@/services/useCharts'
import type { SolarCalculationResult } from '@/types'

const { output, input, settings } = useAppState()
const { updateChart } = useCharts()

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
  const yearlyEnergyDcKwh = config.yearlyEnergyDcKwh
  const panelsCount = config.panelsCount
  const capacityKwp = (panelsCount * 400) / 1000

  // Get values from settings
  const installationCostEuros = Number(settings.installationCostPerKwp.value) * capacityKwp
  const savingsYear1 = (yearlyEnergyDcKwh * output.static.totalEnergyPriceSntPerKwh) / 100
  const maintenanceYearlyCost =
    installationCostEuros * (Number(settings.maintenanceCostFactor.value) / 100)

  // Factors for calculations
  const efficiencyDepreciation = Number(settings.efficiencyDepreciationFactor.value) / 100
  const costIncrease = Number(settings.costIncreaseFactor.value) / 100
  const lifeSpan = Number(settings.installationLifeSpan.value)

  const netCashFlowCumulative: number[] = []

  // Year 0: Initial investment (negative)
  let netCashFlowPerLifeSpan = -installationCostEuros
  netCashFlowCumulative.push(Math.round(netCashFlowPerLifeSpan))

  // Years 1 to lifeSpan
  for (let i = 0; i < Math.min(29, lifeSpan - 1); i++) {
    // -1 because we already did year 0
    if (i === 0) {
      // First year: basic savings minus maintenance
      netCashFlowPerLifeSpan = netCashFlowPerLifeSpan + savingsYear1 - maintenanceYearlyCost
    } else if (i === 14) {
      // Year 15 (i=14 because we start from i=0 for year 1)
      // Year 15: Include inverter replacement cost
      const yearlyAdjustedSavings =
        savingsYear1 * (1 + costIncrease - efficiencyDepreciation) ** (i + 1)
      const inverterCost =
        installationCostEuros * (Number(settings.inverterReplacementCostFactor.value) / 100)
      netCashFlowPerLifeSpan =
        netCashFlowPerLifeSpan + yearlyAdjustedSavings - maintenanceYearlyCost - inverterCost
    } else {
      // Other years: adjusted savings minus maintenance
      const yearlyAdjustedSavings =
        savingsYear1 * (1 + costIncrease - efficiencyDepreciation) ** (i + 1)
      netCashFlowPerLifeSpan =
        netCashFlowPerLifeSpan + yearlyAdjustedSavings - maintenanceYearlyCost
    }

    netCashFlowCumulative.push(Math.round(netCashFlowPerLifeSpan))
  }

  // Fill remaining years up to 30 if needed (keep the last value)
  while (netCashFlowCumulative.length < 30) {
    netCashFlowCumulative.push(netCashFlowCumulative[netCashFlowCumulative.length - 1] || 0)
  }

  return netCashFlowCumulative
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
