import { reactive, toRaw } from 'vue'

import type { BuildingInsightsResponse, SolarPanelConfig } from '@/services/solar'

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
  dailyMaxUtilizationFactor: toRaw(settings.dailyMaxUtilizationFactor),
}

const input = reactive(structuredClone(inputRef))

const output = reactive({
  technicalMax: {} as SolarCalculationResult,
  smartMax: {} as SolarCalculationResult,
  active: {} as SolarCalculationResult,
  static: {
    totalEnergyPriceSntPerKwh: 0,
    areaMeters2: 0,
  },
  calculationBasis: {
    label: null as string | null,
    value: null as string | null,
  },
  monthlyDistribution: [] as number[],
  calculationMonth: null as number | null,
})

const buildingData = reactive({
  building: {} as BuildingInsightsResponse,
  sortedConfigs: [] as SolarPanelConfig[],
})

declare global {
  interface Window {
    vueAppData?: {
      settings?: AppSettings
    }
  }
}

const chartData = reactive({
  labels: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
  datasets: [
    {
      label: 'Solar power',
      backgroundColor: '#18a058',
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ],
})

export function useAppState() {
  return {
    settings,
    jsonData,
    input,
    output,
    buildingData,
    chartData,
  }
}
