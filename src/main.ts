// main.ts
import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import { useAppState } from './useAppState'
import SolarTest from './components/SolarTest.vue'

const app = createApp({
  setup() {
    const state = useAppState()
    return state
  },
  components: {
    'solar-test': SolarTest,
  },
})

app.mount('#content')
