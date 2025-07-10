import { useAppState } from '@/useAppState'
import type { SolarPanelConfig } from './solar'
import type { ExtendedSolarPanelConfig } from '@/types'
const { settings, output, buildingData } = useAppState()

export function findTechnicalMax() {
  return buildingData.sortedConfigs[buildingData.sortedConfigs.length - 1]
}

export function findSmartMax(): ExtendedSolarPanelConfig {
  const rangeStart = settings.smartMaxRangeStart.value
  const rangeEnd = settings.smartMaxRangeEnd.value
  const relativeThreshold = settings.smartMaxTreshold.value / 100
  const fallbackAbsoluteThreshold = settings.smartMaxFallbackTreshold.value

  const configs = buildingData.sortedConfigs as ExtendedSolarPanelConfig[]
  const smartMax = configs[0]

  // Step 1: Check for relative drop in gainPerPanel within inspection range
  for (let i = 1; i < configs.length; i++) {
    const prev = configs[i - 1]
    const curr = configs[i]

    const inRange =
      curr.gainPerPanel != null && curr.gainPerPanel >= rangeStart && curr.gainPerPanel <= rangeEnd
    if (!inRange || prev.gainPerPanel == null) continue

    const dropRatio = (prev.gainPerPanel - curr.gainPerPanel) / prev.gainPerPanel

    if (dropRatio >= relativeThreshold) {
      console.log(
        `Relative drop in gainPerPanel of ${(dropRatio * 100).toFixed(2)}% detected from ${prev.gainPerPanel.toFixed(
          2,
        )} to ${curr.gainPerPanel.toFixed(2)}. Returning config before drop.`,
      )
      return prev
    }
  }

  // Step 2: Fallback to absolute threshold check
  for (let i = 1; i < configs.length; i++) {
    const curr = configs[i]
    if (curr.gainPerPanel != null && curr.gainPerPanel < fallbackAbsoluteThreshold) {
      console.log(
        `Gain per additional panel drops below ${fallbackAbsoluteThreshold} kWh at ${curr.panelsCount} panels.`,
      )
      return configs[i - 1]
    }

    if (i === configs.length - 1) {
      return curr
    }
  }

  return smartMax
}

export function findConfigWithPanelCount(panelsCount: number) {
  return buildingData.sortedConfigs.find((panel) => panel.panelsCount === panelsCount)
}

export function findOptimized(
  annualPowerUsage: number,
  buildingProfile: number[],
): SolarPanelConfig {
  console.log('annualPowerUsage', annualPowerUsage)
  let calculationMonth: number = -1
  let minPower: number = Infinity
  for (let i = 0; i < 12; i++) {
    const monthUsage = buildingProfile[i] * annualPowerUsage
    const annualPower = monthUsage / (output.monthlyDistribution[i] / 100)
    console.log(i, 'annualPower', annualPower)
    if (annualPower < minPower) {
      minPower = annualPower
      calculationMonth = i
    }
  }
  console.log('calculationMonth', calculationMonth)
  console.log('minPower', minPower)
  output.calculationMonth = calculationMonth

  minPower = minPower * Number(settings.dailyMaxUtilizationFactor.value)
  console.log('minPower * dailyMaxUtilizationFactor', minPower)

  const optimized = buildingData.sortedConfigs.reduce((closest, curr) => {
    if (curr.yearlyEnergyAcKwh > minPower) return closest
    if (closest.yearlyEnergyAcKwh > minPower) return curr
    return curr.yearlyEnergyAcKwh - minPower > closest.yearlyEnergyAcKwh - minPower ? curr : closest
  })
  console.log('findOptimized result:', optimized)
  console.log(optimized.yearlyEnergyAcKwh > minPower)
  console.log(optimized.yearlyEnergyAcKwh < minPower)
  return optimized
}

import type { SolarCalculationResult } from '@/types'

export function calculateConfig(config: SolarPanelConfig): SolarCalculationResult {
  const yearlyEnergyDcKwh = config.yearlyEnergyDcKwh
  const dcToAcDerate = Number(settings.dcToAcDerate.value)
  const yearlyEnergyAcKwh = yearlyEnergyDcKwh * dcToAcDerate
  const panelsCount = config.panelsCount
  const capacityKwp = (panelsCount * 400) / 1000
  const yearlyCarbonOffset = (Number(settings.emissionsFactor.value) * yearlyEnergyAcKwh) / 1000
  const savingsYear1 = (yearlyEnergyAcKwh * output.static.totalEnergyPriceSntPerKwh) / 100
  const installationCostEuros = Number(settings.installationCostPerKwp.value) * capacityKwp
  const maintenanceCostsPerLifeSpan =
    installationCostEuros *
    (Number(settings.maintenanceCostFactor.value) / 100) *
    Number(settings.installationLifeSpan.value)

  const totalEnergyAcKwhPerLifeSpan =
    (yearlyEnergyAcKwh *
      (1 -
        (1 - Number(settings.efficiencyDepreciationFactor.value) / 100) **
          Number(settings.installationLifeSpan.value))) /
    (Number(settings.efficiencyDepreciationFactor.value) / 100)

  const totalSavingsPerLifeSpan =
    (((yearlyEnergyAcKwh * output.static.totalEnergyPriceSntPerKwh) / 100) *
      (1 -
        ((1 - Number(settings.efficiencyDepreciationFactor.value) / 100) *
          (1 + Number(settings.costIncreaseFactor.value) / 100)) **
          Number(settings.installationLifeSpan.value))) /
    (1 -
      (1 - Number(settings.efficiencyDepreciationFactor.value) / 100) *
        (1 + Number(settings.costIncreaseFactor.value) / 100))

  const averageYearlySavingsEuros =
    totalSavingsPerLifeSpan / Number(settings.installationLifeSpan.value)

  const totalFinanceCostsPerLifeSpan =
    ((Number(settings.loan?.value) * (Number(settings.interestRate.value) / 100) +
      (Number(settings.loan?.value) / Number(settings.loanDurationYears?.value)) *
        (Number(settings.interestRate.value) / 100)) /
      2) *
    Number(settings.loanDurationYears?.value)

  const inverterReplacementCosts =
    installationCostEuros * (Number(settings.inverterReplacementCostFactor.value) / 100)

  const lcoeSntPerKwh =
    ((installationCostEuros +
      maintenanceCostsPerLifeSpan +
      totalFinanceCostsPerLifeSpan +
      inverterReplacementCosts) /
      totalEnergyAcKwhPerLifeSpan) *
    100

  const paybackYears =
    (Number(settings.installationCostPerKwp.value) * capacityKwp) /
    (savingsYear1 -
      Number(settings.installationCostPerKwp.value) *
        capacityKwp *
        (Number(settings.maintenanceCostFactor.value) / 100))

  const totalCostsPerLifeSpanEuros =
    installationCostEuros +
    maintenanceCostsPerLifeSpan +
    totalFinanceCostsPerLifeSpan +
    inverterReplacementCosts

  // Annual maintenance costs
  const maintenanceCostsPerYear =
    installationCostEuros * (Number(settings.maintenanceCostFactor.value) / 100)

  // Calculate cash flows and IRR
  const cashFlowData = calculateCashFlows(
    installationCostEuros,
    savingsYear1,
    maintenanceCostsPerYear,
    Number(settings.installationLifeSpan.value),
    Number(settings.efficiencyDepreciationFactor.value) / 100,
    Number(settings.costIncreaseFactor.value) / 100,
    Number(settings.inverterReplacementCostFactor.value) / 100,
  )

  const internalRateOfReturn = calculateIRR(cashFlowData.netCashFlowPerYear)
  const netCashFlowCumulative = cashFlowData.netCashFlowCumulative
  let scoreProfitability
  if (internalRateOfReturn > 0.14) {
    scoreProfitability = 100
  } else if (internalRateOfReturn < 0) {
    scoreProfitability = 0
  } else {
    scoreProfitability = internalRateOfReturn / 0.14
  }

  // Net Present Value (assuming discount rate equals interest rate)
  const discountRate = Number(settings.interestRate.value) / 100
  const netPresentValueEuros =
    (totalSavingsPerLifeSpan - totalCostsPerLifeSpanEuros) /
    Math.pow(1 + discountRate, Number(settings.installationLifeSpan.value))

  // Yearly savings rate (%) - requires yearlyEnergyUsageKwh
  const yearlyEnergyUsageKwh = output.yearlyEnergyUsageKwh || yearlyEnergyAcKwh // Fallback to production if usage not available
  const yearlySavingsRate =
    yearlyEnergyUsageKwh > 0
      ? (savingsYear1 / ((yearlyEnergyUsageKwh * output.static.totalEnergyPriceSntPerKwh) / 100)) *
        100
      : 0

  const scoreProduction = calculateScoreProduction(panelsCount)
  return {
    averageYearlySavingsEuros,
    capacityKwp,
    installationCostEuros,
    internalRateOfReturn,
    lcoeSntPerKwh,
    maintenanceCostsPerLifeSpan,
    maintenanceCostsPerYear,
    netCashFlowCumulative,
    netPresentValueEuros,
    panelsCount,
    paybackYears,
    savingsYear1,
    scoreProduction,
    scoreProfitability,
    totalCostsPerLifeSpanEuros,
    totalEnergyAcKwhPerLifeSpan,
    totalFinanceCostsPerLifeSpan,
    totalSavingsPerLifeSpan,
    yearlyCarbonOffset,
    yearlyEnergyAcKwh,
    yearlyEnergyDcKwh,
    yearlySavingsRate,
  }
}

// pass smartMax panelsCount
export function calculateScoreProduction(panelsCount: number): number {
  const panelHeightMeters = buildingData.building.solarPotential.panelHeightMeters
  const panelWidthMeters = buildingData.building.solarPotential.panelWidthMeters
  const areaMeters2 = buildingData.building.solarPotential.wholeRoofStats.areaMeters2

  return Math.min(
    ((panelsCount * panelHeightMeters * panelWidthMeters) / (areaMeters2 / 2)) * 100,
    100,
  )
}

function calculateCashFlows(
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

// Helper function to calculate Internal Rate of Return (IRR)
function calculateIRR(cashFlows: number[]): number {
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
