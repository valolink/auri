import { reactive, toRaw } from 'vue'

import type { SolarPanelConfig } from '@/services/solar'

import type { SolarCalculationResult, AppSettings } from '@/types'

const settings = reactive({
  ...(window.vueAppData!.settings as AppSettings),
})

const jsonData = reactive({
  geoResult: null as string | null,
  buildingResult: null as string | null,
  layerResult: null as string | null,
  error: null as string | null,
})

const inputRef = {
  address: 'Rajatorpantie 8',
  calculationBasis: toRaw(
    settings.calculationBasis.options.find((option) => option.value === 'targetPower') as {
      label: string
      value: string
    },
  ),
  buildingType: toRaw(settings.buildingType),
  targetPower: toRaw(settings.targetPower),
  panelCount: toRaw(settings.panelCount),
  yearlyEnergyUsageKwh: toRaw(settings.yearlyEnergyUsageKwh),
}

const input = reactive(structuredClone(inputRef))

const output = reactive({
  technicalMax: {} as SolarCalculationResult,
  smartMax: {} as SolarCalculationResult,
  active: {} as SolarCalculationResult,
  static: {
    totalEnergyPriceSntPerKwh: 0,
  },
  calculationBasis: {
    label: null as string | null,
    value: null as string | null,
  },
  monthlyDistribution: [] as number[],
  bestPanelMonthlyDistribution: [] as number[],
  calculationMonth: null as number | null,
})

const buildingData = reactive({
  building: {},
  sortedConfigs: [] as SolarPanelConfig[],
})

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
    input,
    output,
    buildingData,
  }
}
