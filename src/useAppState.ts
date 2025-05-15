import { reactive } from 'vue'

interface SelectField {
  label: string
  description: string
  value: string
  options: Record<string, string>
  sanitize: string
  type: 'select'
}

interface TextField {
  label: string
  description: string
  value: number
  sanitize: string
  type: 'number'
  step?: string
  options?: Record<string, string>
}

interface AppSettings {
  calculationBasis: SelectField
  powerConsumptionProfile: SelectField
  yearlyEnergyUsageKwh: TextField
  powerProfile: string
  yearlyConsumption: number
  targetPower: number
  panelCount: number
  address: string
  [key: string]: any
}

const settings = reactive<AppSettings>({
  calculationBasis: {
    label: 'Laskentaperuste',
    description: 'Choose the default:',
    value: 'smartMax',
    options: {
      profileOptimum: 'Profiilioptimoitu paneelimäärä',
      smartMax: 'Teho-optimoitu paneelimäärä',
      targetPower: 'Tavoiteteho',
      technicalMax: 'Tekninen maksimipaneelimäärä',
    },
    sanitize: 'sanitize_text_field',
    type: 'select',
  },
  powerConsumptionProfile: {
    label: 'Kulutusprofiili',
    description: 'Valitse profiili',
    value: 'profileA',
    options: {
      profileA: 'Profile A (Standard)',
      profileB: 'Profile B (Industrial)',
      profileC: 'Profile C (Evening-heavy)',
      custom: 'Custom Profile',
    },
    sanitize: 'sanitize_text_field',
    type: 'select',
  },
  yearlyEnergyUsageKwh: {
    label: 'Vuotuinen sähkönkulutus (kWh/v)',
    description: '-',
    value: 12000,
    sanitize: 'floatval',
    type: 'number',
  },
  powerProfile: 'default',
  yearlyConsumption: 12000,
  targetPower: 6.0,
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
      settings?: Partial<AppSettings>
    }
  }
}

export function useAppState() {
  return {
    settings,
    jsonData,
  }
}
