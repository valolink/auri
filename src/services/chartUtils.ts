import { useAppState } from '@/useAppState'
import { useCharts } from '@/services/useCharts'

const { output, input, settings } = useAppState()
const { updateChart } = useCharts()

// Energy Chart Functions
export function updateEnergyChart(
  yearlyEnergy: number = output.active.yearlyEnergyDcKwh,
  distribution: number[] = output.monthlyDistribution,
  yearlyUsage: number = input.yearlyEnergyUsageKwh.value,
  buildingProfile: number[] = JSON.parse(input.buildingType.value),
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

function calculateLifecycleSavings(config: SolarPanelConfig): number[] {
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

  const cumulativeSavings: number[] = []
  let runningTotal = -installationCostEuros // Start negative with installation cost

  for (let year = 1; year <= Math.min(30, lifeSpan); year++) {
    // Calculate efficiency for this year (panels degrade over time)
    const efficiencyFactor = (1 - efficiencyDepreciation) ** (year - 1)

    // Calculate energy price for this year (prices increase over time)
    const energyPriceFactor = (1 + costIncrease) ** (year - 1)

    // Yearly energy production (decreasing due to panel degradation)
    const yearlyEnergy = yearlyEnergyDcKwh * efficiencyFactor

    // Yearly savings (increasing due to energy price inflation, decreasing due to efficiency loss)
    const yearlySavings =
      (yearlyEnergy * output.static.totalEnergyPriceSntPerKwh * energyPriceFactor) / 100

    // Subtract yearly maintenance costs
    const netYearlySavings = yearlySavings - maintenanceYearlyCost

    // Add inverter replacement cost (typically around year 15)
    let inverterCost = 0
    if (year === 15) {
      inverterCost =
        installationCostEuros * (Number(settings.inverterReplacementCostFactor.value) / 100)
    }

    // Update running total
    runningTotal += netYearlySavings - inverterCost
    cumulativeSavings.push(Math.round(runningTotal))
  }

  // Fill remaining years if less than 30
  while (cumulativeSavings.length < 30) {
    cumulativeSavings.push(cumulativeSavings[cumulativeSavings.length - 1] || 0)
  }

  return cumulativeSavings
}

export function updateSavingsChart() {
  const cumulativeSavings = calculateLifecycleSavings(output.active)
  const currentYear = new Date().getFullYear()
  const labels = Array.from({ length: 30 }, (_, i) => (currentYear + i + 1).toString())

  const datasets = [
    {
      label: 'Kumulatiiviset säästöt',
      backgroundColor: (ctx: any) => {
        return ctx.parsed.y < 0 ? '#ef4444' : '#10b981'
      },
      borderColor: (ctx: any) => {
        return ctx.parsed.y < 0 ? '#dc2626' : '#059669'
      },
      data: cumulativeSavings,
      type: 'line',
    },
  ]

  updateChart('savings', labels, datasets)
}
