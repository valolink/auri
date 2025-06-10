import { useAppState } from '@/useAppState'
import type { SolarPanelConfig } from './solar'
const { settings, output, buildingData } = useAppState()

export function findTechnicalMax() {
  return buildingData.sortedConfigs[buildingData.sortedConfigs.length - 1]
}

export function findSmartMax(): SolarPanelConfig {
  let smartMax = buildingData.sortedConfigs[0]
  for (let i = 1; i < buildingData.sortedConfigs.length; i++) {
    const prev = buildingData.sortedConfigs[i - 1]
    const curr = buildingData.sortedConfigs[i]
    const panelDiff = curr.panelsCount - prev.panelsCount
    const energyGain = curr.yearlyEnergyDcKwh - prev.yearlyEnergyDcKwh
    const gainPerPanel = energyGain / panelDiff

    // TODO add raja-arvo to settings
    // Smart max threshold check
    if (gainPerPanel < 320) {
      console.log(
        `Gain per additional panel drops below 320 kWh from ${prev.panelsCount} to ${curr.panelsCount} panels.`,
      )
      smartMax = prev
      break // No need to keep scanning
    }

    // If we're at the end and no drop happened, take the last one
    if (i === buildingData.sortedConfigs.length - 1) {
      smartMax = curr
    }
  }

  return smartMax
}

export function findConfigWithPanelCount(panelsCount: number) {
  return buildingData.sortedConfigs.find((panel) => panel.panelsCount === panelsCount)
}

export function findOptimized(annualPowerUsage: number, buildingProfile: string): SolarPanelConfig {
  console.log('annualPowerUsage', annualPowerUsage)
  let calculationMonth: number = -1
  let minPower: number = Infinity
  const profile: number[] = JSON.parse(buildingProfile)
  console.log('profile', profile)
  for (let i = 0; i < 12; i++) {
    const monthUsage = profile[i] * annualPowerUsage
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

  //TODO add dailyMaxUtilizationFactor here:
  //minPower = minPower * dailyMaxUtilizationFactor

  const optimized = buildingData.sortedConfigs.reduce((closest, curr): SolarPanelConfig => {
    if (curr.yearlyEnergyDcKwh > minPower) return closest
    if (closest.yearlyEnergyDcKwh > minPower) return curr
    return curr.yearlyEnergyDcKwh - minPower > closest.yearlyEnergyDcKwh - minPower ? curr : closest
  })
  console.log('findOptimized result:', optimized)
  console.log(optimized.yearlyEnergyDcKwh > minPower)
  console.log(optimized.yearlyEnergyDcKwh < minPower)
  return optimized
}

import type { SolarCalculationResult } from '@/types'

export function calculateConfig(config: SolarPanelConfig): SolarCalculationResult {
  const yearlyEnergyDcKwh = config.yearlyEnergyDcKwh
  const panelsCount = config.panelsCount
  const capacityKwp = (panelsCount * 400) / 1000
  const yearlyCarbonOffset = Number(settings.emissionsFactor.value) * yearlyEnergyDcKwh
  const savingsYear1 = (yearlyEnergyDcKwh * output.static.totalEnergyPriceSntPerKwh) / 100
  const installationCostEuros = Number(settings.installationCostPerKwp.value) * capacityKwp
  const maintenanceCostsPerLifeSpan =
    installationCostEuros *
    (Number(settings.maintenanceCostFactor.value) / 100) *
    Number(settings.installationLifeSpan.value)

  const totalEnergyDcKwhPerLifeSpan =
    (yearlyEnergyDcKwh *
      (1 -
        (1 - Number(settings.efficiencyDepreciationFactor.value) / 100) **
          Number(settings.installationLifeSpan.value))) /
    (Number(settings.efficiencyDepreciationFactor.value) / 100)

  const totalSavingsPerLifeSpan =
    (((yearlyEnergyDcKwh * output.static.totalEnergyPriceSntPerKwh) / 100) *
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

  const lcoeSntPerKwh =
    (installationCostEuros +
      maintenanceCostsPerLifeSpan +
      totalFinanceCostsPerLifeSpan +
      Number(settings.inverterReplacementCostFactor.value) / 100) /
    totalEnergyDcKwhPerLifeSpan

  const paybackYears =
    (Number(settings.installationCostPerKwp.value) * capacityKwp) /
    (savingsYear1 -
      Number(settings.installationCostPerKwp.value) *
        capacityKwp *
        (Number(settings.maintenanceCostFactor.value) / 100))

  return {
    yearlyEnergyDcKwh,
    panelsCount,
    capacityKwp,
    yearlyCarbonOffset,
    savingsYear1,
    installationCostEuros,
    maintenanceCostsPerLifeSpan,
    totalEnergyDcKwhPerLifeSpan,
    totalSavingsPerLifeSpan,
    averageYearlySavingsEuros,
    totalFinanceCostsPerLifeSpan,
    lcoeSntPerKwh,
    paybackYears,
  }
}
