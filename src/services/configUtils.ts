import { useAppState } from '@/useAppState'
import type { SolarPanelConfig } from './solar'
import type { ExtendedSolarPanelConfig } from '@/types'
const { settings, output, buildingData, input } = useAppState()

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

  updateSortedConfigs()

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

 function updateSortedConfigs() {
  const configs = buildingData.building?.solarPotential?.solarPanelConfigs || []
  buildingData.sortedConfigs = configs
    .sort((a, b) => a.panelsCount - b.panelsCount)
    .map((config, index, array) => {
      const yearlyEnergyAcKwh =
        config.yearlyEnergyDcKwh *
        settings.dcToAcDerate.value *
        (1 + settings.tiltBoostFactor.value / 100)

      let gainPerPanel = null
      if (index > 0) {
        const prev = array[index - 1]
        const panelDiff = config.panelsCount - prev.panelsCount
        const energyGain = config.yearlyEnergyDcKwh - prev.yearlyEnergyDcKwh
        gainPerPanel = panelDiff > 0 ? energyGain / panelDiff : null
      }

      return {
        ...config,
        gainPerPanel,
        yearlyEnergyAcKwh,
      }
    })
}

import type { SolarCalculationResult } from '@/types'
import {
  calculateCashFlows,
  calculateBasicFinancials,
  calculateIRR,
} from '@/services/cashFlowUtils'

export function calculateConfig(config: SolarPanelConfig): SolarCalculationResult {
  const basicFinancials = calculateBasicFinancials(config)

  const {
    yearlyEnergyAcKwh,
    yearlyEnergyDcKwh,
    panelsCount,
    capacityKwp,
    savingsYear1,
    installationCostEuros,
    maintenanceCostsPerYear,
  } = basicFinancials

  const yearlyCarbonOffset = (Number(settings.emissionsFactor.value) * yearlyEnergyAcKwh) / 1000
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
    (savingsYear1 *
      (1 -
        ((1 - Number(settings.efficiencyDepreciationFactor.value) / 100) *
          (1 + Number(settings.costIncreaseFactor.value) / 100)) **
          Number(settings.installationLifeSpan.value))) /
    (1 -
      (1 - Number(settings.efficiencyDepreciationFactor.value) / 100) *
        (1 + Number(settings.costIncreaseFactor.value) / 100))

  const averageYearlySavingsEuros =
    totalSavingsPerLifeSpan / Number(settings.installationLifeSpan.value)

  const yearlyExcessEnergyAcKwh = yearlyEnergyAcKwh * (Number(settings.excessRate.value) / 100)

  const yearlySelfUseEnergyAcKwh = yearlyEnergyAcKwh * (1 - Number(settings.excessRate.value) / 100)

  const selfSufficiencyRate =
    (yearlySelfUseEnergyAcKwh / Number(input.yearlyEnergyUsageKwh.value)) * 100

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
  if (internalRateOfReturn > 14) {
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
  const yearlyEnergyUsageKwh = output.active.yearlyEnergyUsageKwh || yearlyEnergyAcKwh // Fallback to production if usage not available
  const yearlySavingsRate =
    yearlyEnergyUsageKwh > 0
      ? (savingsYear1 / ((yearlyEnergyUsageKwh * output.static.totalEnergyPriceSntPerKwh) / 100)) *
        100
      : 0

  const scoreProduction = calculateScoreProduction(panelsCount, yearlyEnergyAcKwh)
  const scoreUtilization = calculateScoreUtilization(yearlyEnergyAcKwh)

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
    scoreUtilization,
    selfSufficiencyRate,
    totalCostsPerLifeSpanEuros,
    totalEnergyAcKwhPerLifeSpan,
    totalFinanceCostsPerLifeSpan,
    totalSavingsPerLifeSpan,
    yearlyCarbonOffset,
    yearlyEnergyAcKwh,
    yearlyEnergyDcKwh,
    yearlyExcessEnergyAcKwh,
    yearlySavingsRate,
    yearlySelfUseEnergyAcKwh,
  }
}

// pass smartMax panelsCount
export function calculateScoreProduction(panelsCount: number, yearlyEnergyAcKwh: number): number {
  // const panelHeightMeters = buildingData.building.solarPotential.panelHeightMeters
  // const panelWidthMeters = buildingData.building.solarPotential.panelWidthMeters
  // const areaMeters2 = buildingData.building.solarPotential.wholeRoofStats.areaMeters2

  // return Math.min(
  //   ((panelsCount * panelHeightMeters * panelWidthMeters) / (areaMeters2 / 2)) * 100,
  //   100,
  // )

  let scoreProduction = 0

  if(yearlyEnergyAcKwh / panelsCount > 350){
    scoreProduction = 100;
  }
  else if(yearlyEnergyAcKwh / panelsCount < 200) {
    scoreProduction = 0;
  }
  else {
    scoreProduction = (yearlyEnergyAcKwh / panelsCount - 200) / 150 * 100;
  }

  return scoreProduction
}

export function calculateScorePotential(): number {
  const panelHeightMeters = buildingData.building.solarPotential.panelHeightMeters
  const panelWidthMeters = buildingData.building.solarPotential.panelWidthMeters
  const areaMeters2 = buildingData.building.solarPotential.wholeRoofStats.areaMeters2

  let scorePotential = 0

  if(output.smartMax.panelsCount * panelHeightMeters * panelWidthMeters >= (areaMeters2 / 2)){
    scorePotential = 100;
  }
  else {
    scorePotential = (output.smartMax.panelsCount * panelHeightMeters * panelWidthMeters) / (areaMeters2 / 2) * 100;
  }

  return scorePotential
}

export function calculateScoreUtilization(yearlyEnergyAcKwh: number): number {
  let scoreUtilization = 0

  if(yearlyEnergyAcKwh > output.smartMax.yearlyEnergyAcKwh){
    scoreUtilization = 100;
  }
  else {
    scoreUtilization = (yearlyEnergyAcKwh / output.smartMax.yearlyEnergyAcKwh) * 100;
  }

  return scoreUtilization
}

