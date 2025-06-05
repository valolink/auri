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
  ...window.vueAppData?.settings,
})

const jsonData = reactive({
  geoResult: null as string | null,
  buildingResult: null as string | null,
  layerResult: null as string | null,
  error: null as string | null,
})

const inputRef = {
  address: 'Rajatorpantie 8',
  calculationBasis:
    window.vueAppData?.settings.calculationBasis.options.find(
      // (option) => option.value === window.vueAppData?.settings.calculationBasis.value,
      (option) => option.value === 'targetPower',
    ) || null,
  buildingType: window.vueAppData?.settings.buildingType,
  targetPower: window.vueAppData?.settings.targetPower,
  panelCount: window.vueAppData?.settings.panelCount,
  yearlyEnergyUsageKwh: window.vueAppData?.settings.yearlyEnergyUsageKwh,
  buildingType: window.vueAppData?.settings.buildingType,
}

const input = reactive(structuredClone(inputRef))

const output = reactive({
  technicalMax: {},
  smartMax: {},
  active: {},
  static: {},
  calculationBasis: {
    label: null as string | null,
    value: null as string | null,
  },
  monthlyDistribution: [] as number[],
  bestPanelMonthlyDistribution: [] as number[],
  calculationMonth: null as number,
})

const buildingData = reactive({
  building: {},
  sortedConfigs: [],
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
