import { reactive } from 'vue'

interface BaseSetting<T = string | number | boolean> {
  label: string
  description: string
  value: T
  sanitize: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea'
  step?: string
}

interface SelectSetting extends BaseSetting<string> {
  type: 'select'
  options: { label: string; value: string }[]
}

interface CheckboxSetting extends BaseSetting<boolean> {
  type: 'checkbox'
}

interface NumberSetting extends BaseSetting<number> {
  type: 'number'
}

interface TextSetting extends BaseSetting<string> {
  type: 'text' | 'textarea'
}

type Setting = SelectSetting | CheckboxSetting | NumberSetting | TextSetting

export type AppSettings = Record<string, Setting>

const settings = reactive<AppSettings>({
  address: 'Rajatorpantie 8',
  ...window.vueAppData?.settings,
})

const jsonData = reactive({
  geoResult: null as string | null,
  buildingResult: null as string | null,
  layerResult: null as string | null,
  error: null as string | null,
})

const output = reactive({
  technicalMax: {},
  smartMax: {},
  profileOptimum: {},
  targetPower: {},
  targetPanelCount: {},
  static: {},
})

const calculateConfig = function (config) {
  const yearlyEnergyDcKwh = config.yearlyEnergyDcKwh
  const panelsCount = config.panelsCount
  const capacityKwp = (panelsCount * 400) / 1000
  const yearlyCarbonOffset = Number(settings.emissionsFactor.value) * yearlyEnergyDcKwh
  const savingsYear1 = (yearlyEnergyDcKwh * output.static.totalEnergyPriceSntPerKwh) / 1000
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
  }
}

declare global {
  interface Window {
    vueAppData?: {
      settings?: AppSettings
    }
  }
}

export function useAppState() {
  return {
    settings,
    jsonData,
    output,
    calculateConfig,
  }
}
