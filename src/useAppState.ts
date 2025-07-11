import { ref, reactive, toRaw, markRaw, type Ref } from 'vue'
import type { Chart } from 'chart.js'
import type { SolarCalculationResult, AppSettings } from '@/types'
import type { BuildingInsightsResponse, SortedSolarPanelConfig } from '@/services/solar'

const settings = reactive({
  ...(window.vueAppData!.settings as AppSettings),
})

const role = window.vueAppData!.role

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
  extraRadius: 0,
  customProfile: { active: false, value: '' },
  buildingTypeLabel: '',
  normalizedDistribution: '',
  energyProfile: [],
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
    label: '',
    value: '',
  },
  monthlyDistribution: [] as number[],
  calculationMonth: -1,
  addressFromApi: '' as string,
  buildingRadius: 0,
  buildingCenter: {
    lat: 0,
    lng: null as number | null,
  },
  placeNameFromApi: '',
}

const output = reactive({ ...initialOutput, reset })

function reset() {
  Object.assign(output, initialOutput)
}

const buildingData = reactive({
  building: {} as BuildingInsightsResponse,
  sortedConfigs: [] as SortedSolarPanelConfig[],
})

declare global {
  interface Window {
    vueAppData?: {
      settings: AppSettings
      ajax_url: string
      role: string
    }
  }
}

interface ChartRefs {
  [key: string]: Ref<Chart | null>
}

const registerChart = (chartId: string, chart: Chart) => {
  console.log('Registering chart:', chartId, chart) // Add this debug line
  if (!chartRefs[chartId]) {
    chartRefs[chartId] = ref<Chart | null>(null)
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
    role,
  }
}
