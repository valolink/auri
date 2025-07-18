// cashFlowUtils.ts - Shared utility functions
import { useAppState } from '@/useAppState'

const { settings, output } = useAppState()

export function calculateCashFlows(
  installationCostEuros: number,
  savingsYear1: number,
  maintenanceCostsPerYear: number,
  installationLifeSpan: number,
  efficiencyDepreciationFactor: number,
  costIncreaseFactor: number,
  inverterReplacementCostFactor: number,
): { netCashFlowPerYear: number[]; netCashFlowCumulative: number[] } {
  const netCashFlowPerYear: number[] = []
  const netCashFlowCumulative: number[] = []

  // Year 0: Initial investment (negative)
  const initialInvestment = -installationCostEuros
  netCashFlowPerYear.push(initialInvestment)

  // Initialize cumulative cash flow
  let netCashFlowPerLifeSpan = initialInvestment
  netCashFlowCumulative.push(netCashFlowPerLifeSpan)

  // Calculate cash flows for each year
  for (let i = 0; i < installationLifeSpan; i++) {
    let yearlyNetCashFlow: number

    if (i === 0) {
      // First year: savings - maintenance
      yearlyNetCashFlow = savingsYear1 - maintenanceCostsPerYear
    } else if (i === 14) {
      // Year 15 (index 14): includes inverter replacement cost
      const adjustedSavings =
        savingsYear1 * Math.pow(1 + costIncreaseFactor - efficiencyDepreciationFactor, i + 1)
      const inverterCost = installationCostEuros * inverterReplacementCostFactor
      yearlyNetCashFlow = adjustedSavings - maintenanceCostsPerYear - inverterCost
    } else {
      // Other years: adjusted savings - maintenance
      const adjustedSavings =
        savingsYear1 * Math.pow(1 + costIncreaseFactor - efficiencyDepreciationFactor, i + 1)
      yearlyNetCashFlow = adjustedSavings - maintenanceCostsPerYear
    }

    netCashFlowPerYear.push(yearlyNetCashFlow)

    // Update cumulative cash flow
    netCashFlowPerLifeSpan += yearlyNetCashFlow
    netCashFlowCumulative.push(netCashFlowPerLifeSpan)
  }

  return { netCashFlowPerYear, netCashFlowCumulative }
}

export function calculateBasicFinancials(config: { panelsCount: number; yearlyEnergyDcKwh: number }) {
  const tiltBoostFactor = Number(settings.tiltBoostFactor.value)
  const yearlyEnergyDcKwh = config.yearlyEnergyDcKwh * ( 1 + ( tiltBoostFactor/100 ) )
  const dcToAcDerate = Number(settings.dcToAcDerate.value)
  const yearlyEnergyAcKwh = yearlyEnergyDcKwh * dcToAcDerate
  const panelsCount = config.panelsCount
  const capacityKwp = (panelsCount * 400) / 1000

  const savingsYear1 =
    (((100 - settings.excessRate.value) / 100) *
      (yearlyEnergyAcKwh * output.static.totalEnergyPriceSntPerKwh)) /
      100 +
    ((settings.excessRate.value / 100) * (yearlyEnergyAcKwh * settings.excessSalePriceSnt.value)) /
      100

  const installationCostEuros = Number(settings.installationCostPerKwp.value) * capacityKwp
  const maintenanceCostsPerYear =
    installationCostEuros * (Number(settings.maintenanceCostFactor.value) / 100)

  return {
    yearlyEnergyAcKwh,
    yearlyEnergyDcKwh,
    panelsCount,
    capacityKwp,
    savingsYear1,
    installationCostEuros,
    maintenanceCostsPerYear,
  }
}

// Helper function to calculate Internal Rate of Return (IRR)
export function calculateIRR(cashFlows: number[]): number {
  // Newton-Raphson method to find IRR
  let rate = 0.1 // Initial guess: 10%
  const tolerance = 1e-6
  const maxIterations = 100

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let dnpv = 0

    for (let j = 0; j < cashFlows.length; j++) {
      const power = Math.pow(1 + rate, j)
      npv += cashFlows[j] / power
      dnpv -= (j * cashFlows[j]) / (power * (1 + rate))
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100 // Return as percentage
    }

    if (Math.abs(dnpv) < tolerance) {
      break // Avoid division by zero
    }

    rate = rate - npv / dnpv
  }

  // If convergence fails, return 0
  return 0
}
