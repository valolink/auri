import { ref } from 'vue'

const message = ref('hello')

export function useAppState() {
  return {
    message,
  }
}
