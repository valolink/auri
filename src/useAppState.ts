import { reactive } from 'vue'

const settings = reactive(window.vueAppData?.settings || {})

export function useAppState() {
  return {
    settings,
  }
}
