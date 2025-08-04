// main.ts
import './assets/main.css'
import { createApp } from 'vue'
import { useAppState } from './useAppState'
import DataView from './components/DataView.vue'
import MapView from './components/MapView.vue'
import CalculationInputs from './components/CalculationInputs.vue'
import AuriChart from '@/components/AuriChart.vue'
import LoadingIndicator from './components/LoadingIndicator.vue'
import ResultItem from './components/ResultItem.vue'
import ResultList from './components/ResultList.vue'

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
    'auri-chart': AuriChart,
    'loading-indicator': LoadingIndicator,
    'result-item': ResultItem,
    'result-list': ResultList,
  },
})

app.mount('#content')
