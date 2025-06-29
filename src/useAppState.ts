import { ref, reactive, toRaw, markRaw } from 'vue'
import type { SolarCalculationResult, AppSettings } from '@/types'
import type { BuildingInsightsResponse, SolarPanelConfig } from '@/services/solar'
const settings = reactive({
  ...(window.vueAppData!.settings as AppSettings),
})

import type { Chart } from 'chart.js'

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

const initialOutput = {
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
  addressFromApi: '' as string,
  roofSize: 0,
}

const output = reactive(initialOutput)

const buildingData = reactive({
  building: {} as BuildingInsightsResponse,
  sortedConfigs: [] as SolarPanelConfig[],
})

declare global {
  interface Window {
    vueAppData?: {
      settings: AppSettings
      ajax_url: string
    }
  }
}

interface ChartRefs {
  [key: string]: Ref<any>
}

const registerChart = (chartId: string, chart: Chart) => {
  console.log('Registering chart:', chartId, chart) // Add this debug line
  if (!chartRefs[chartId]) {
    chartRefs[chartId] = ref()
  }
  chartRefs[chartId].value = markRaw(chart)
  console.log('Chart stored:', chartRefs[chartId].value) // Add this debug line
}

const chartRefs: ChartRefs = {}
const mapRef = ref<HTMLElement | null>(null)
const mapInstance = ref<google.maps.Map | null>(null) // Google Map object
const loading = ref(false)
const ajaxUrl = window.vueAppData!.ajax_url

export function useAppState() {
  return {
    settings,
    jsonData,
    input,
    output,
    initialOutput,
    buildingData,
    chartRefs,
    registerChart,
    mapRef,
    mapInstance,
    loading,
    ajaxUrl,
  }
}
