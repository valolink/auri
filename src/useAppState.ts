import { reactive } from 'vue'

const settings = reactive({
  calculationBasis: 'smartMax',
  powerProfile: 'default',
  yearlyConsumption: 12000,
  targetPower: 6.0, // in kWp
  panelCount: 15,
  address: 'Rajatorpantie 8',
  ...window.vueAppData?.settings,
})

const jsonData = reactive({
  geoResult: null as string | null,
  buildingResult: null as string | null,
  layerResult: null as string | null,
  error: null as string | null,
})

declare global {
  interface Window {
    vueAppData?: {
      settings?: Record<string, AppSetting>
    }
  }

  interface AppSetting {
    label: string
    type: 'number' | 'text' | 'select' | 'checkbox' | 'textarea'
    sanitize: string
    description: string
    value: string | number | boolean
    step?: string
    options?: Record<string, string>
  }
}

export function useAppState() {
  return {
    settings,
    jsonData,
  }
}
