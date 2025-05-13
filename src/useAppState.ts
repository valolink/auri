import { reactive } from 'vue'

const settings = reactive(window.vueAppData?.settings || {})

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
  }
}
