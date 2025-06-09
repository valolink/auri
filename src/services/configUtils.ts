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

export function findOptimized() {
  let calculationMonth = 0
  let minDiff = 100
  const profile = JSON.parse(settings.buildingType.value)
  console.log('profile', profile)
  for (let i = 0; i < 12; i++) {
    const diff = profile[i] * 100 - Number(output.monthlyDistribution[i])

    console.log(i, 'profile[i]', profile[i] * 100)
    console.log(i, 'output.monthlyDistribution ', Number(output.monthlyDistribution[i]))
    console.log('diff ', i, diff)
    if (diff < minDiff) {
      minDiff = diff
      calculationMonth = i
    }
  }
  console.log(calculationMonth)
  output.calculationMonth = calculationMonth
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
