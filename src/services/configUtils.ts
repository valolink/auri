import { useAppState } from '@/useAppState'
const { settings, output, buildingData } = useAppState()

export function updatePanelConfig() {
  findConfigs(false, true, false)
}

export function updateProfileConfig() {
  findConfigs(true, false, false)
}

export function findConfigs(panelCount = true, energyTarget = true, smartMax = true) {
  let foundSmartMax = smartMax
  let foundTarget = panelCount
  let foundEnergyTarget = energyTarget

  let bestUnderEnergyConfig = null
  let closestEnergyDiff = Infinity

  for (let i = 1; i < buildingData.sortedConfigs.length; i++) {
    const prev = buildingData.sortedConfigs[i - 1]
    const curr = buildingData.sortedConfigs[i]
    const panelDiff = curr.panelsCount - prev.panelsCount
    const energyGain = curr.yearlyEnergyDcKwh - prev.yearlyEnergyDcKwh
    const gainPerPanel = energyGain / panelDiff

    // TODO add raja-arvo to settings
    // 1. Smart max detection
    if (!foundSmartMax && gainPerPanel < 320) {
      output.smartMax = calculateConfig(prev)
      console.log(
        `Gain per additional panel drops below 320 kWh from ${prev.panelsCount} to ${curr.panelsCount} panels.`,
      )
      foundSmartMax = true
    }

    // 2. Exact panel count match
    if (!foundTarget && curr.panelsCount === settings.panelCount.value) {
      output.targetPower = calculateConfig(curr)
      console.log(`Found config with target panel count: ${settings.panelCount.value}`)
      foundTarget = true
    }

    // 3. Closest under target energy
    if (!foundEnergyTarget) {
      if (curr.yearlyEnergyDcKwh <= settings.yearlyEnergyUsageKwh.value) {
        const diff = settings.yearlyEnergyUsageKwh.value - curr.yearlyEnergyDcKwh
        if (diff < closestEnergyDiff) {
          closestEnergyDiff = diff
          bestUnderEnergyConfig = curr
        }
      } else {
        // crossed the threshold: finalize the best config found
        if (bestUnderEnergyConfig !== null) {
          output.profileOptimum = calculateConfig(bestUnderEnergyConfig)
          console.log(
            `Found closest config under target energy (${settings.yearlyEnergyUsageKwh.value} kWh): ${bestUnderEnergyConfig.yearlyEnergyDcKwh} kWh with ${bestUnderEnergyConfig.panelsCount} panels`,
          )
          foundEnergyTarget = true
        }
      }
    }

    // Stop when all three are found
    if (foundSmartMax && foundTarget && foundEnergyTarget) {
      break
    }
  }
}

export function calculateConfig(config) {
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
      (1 - (1 - Number(settings.efficiencyDepreciationFactor.value) / 100)) **
        Number(settings.installationLifeSpan.value)) /
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

  const totalFinanceCostsPerLifeSpan = ( Number(settings.loan?.value) *  (Number(settings.interestRate.value)/100) + Number(settings.loan?.value) / Number(settings.loanDurationYears?.value) * (Number(settings.interestRate.value)/100) ) / 2 *  Number(settings.loanDurationYears?.value)

  const lcoeSntPerKwh = ( installationCostEuros + maintenanceCostsPerLifeSpan + totalFinanceCostsPerLifeSpan + (Number(settings.inverterReplacementCostFactor.value)/100) ) / totalEnergyDcKwhPerLifeSpan

  const paybackYears = Number(settings.installationCostPerKwp.value) * capacityKwp / ( savingsYear1 - Number(settings.installationCostPerKwp.value) * capacityKwp * (Number(settings.maintenanceCostFactor.value)/100) )

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
