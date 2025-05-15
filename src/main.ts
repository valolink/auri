// main.ts
import './assets/main.css'
import { createApp } from 'vue'
import { useAppState } from './useAppState'
import DataView from './components/DataView.vue'
import MapView from './components/MapView.vue'
import CalculationInputs from './components/CalculationInputs.vue'

const app = createApp({
  setup() {
    const state = useAppState()
    console.log('settings', state.settings)
    return state
  },
  components: {
    'data-view': DataView,
    'calculation-inputs': CalculationInputs,
    'map-view': MapView,
  },
})

app.mount('#content')
