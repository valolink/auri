import { reactive } from 'vue'

interface BaseSetting<T = any> {
  label: string
  description: string
  value: T
  sanitize: string
  type: string
  step?: string
  options?: Record<string, string>
}

export type AppSettings = Record<string, BaseSetting>

const settings = reactive<AppSettings>({
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
      settings?: AppSettings
    }
  }
}

export function useAppState() {
  return {
    settings,
    jsonData,
  }
}
