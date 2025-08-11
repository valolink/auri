<!-- InputsDrawer.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { NDrawer, NDrawerContent, NButton } from 'naive-ui'
import CalculationInputs from '@/components/CalculationInputs.vue'

const show = ref(false)
const isWide = ref(true)
const hostsReady = ref(false)
let mql: MediaQueryList

function syncBp() {
  isWide.value = window.matchMedia('(min-width: 1400px)').matches
  if (isWide.value) show.value = false
}

onMounted(async () => {
  mql = window.matchMedia('(min-width: 1400px)')
  syncBp()
  mql.addEventListener('change', syncBp)

  await nextTick()
  // make sure the inline host exists in the WP input column
  hostsReady.value = !!document.querySelector('#inline-input-host')
  if (!hostsReady.value) {
    console.warn('Missing #inline-input-host in the input column.')
  }
})

onBeforeUnmount(() => mql?.removeEventListener('change', syncBp))

// switch Teleport destination based on width
const toSelector = computed(() => (isWide.value ? '#inline-input-host' : '#drawer-host'))
</script>

<template>
  <!-- put this in your MAIN/content column -->
  <n-button class="input-toggle-btn" quaternary @click="show = true"> Muokkaa asetuksia </n-button>

  <!-- keep drawer DOM mounted even when closed -->
  <n-drawer
    v-model:show="show"
    placement="left"
    :width="420"
    display-directive="show"
    :trap-focus="false"
  >
    <n-drawer-content title="Filters">
      <div id="drawer-host"></div>
    </n-drawer-content>
  </n-drawer>

  <!-- single instance moved between hosts -->
  <teleport v-if="hostsReady" :to="toSelector">
    <CalculationInputs />
  </teleport>
</template>
