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
  active: {},
  static: {},
  monthlyDistribution: [] as number[],
  bestPanelMonthlyDistribution: [] as number[],
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
    output,
    buildingData,
  }
}
