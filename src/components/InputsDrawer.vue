<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watchEffect } from 'vue'
import { NDrawer, NDrawerContent, NButton } from 'naive-ui'
import CalculationInputs from '@/components/CalculationInputs.vue'

const show = ref(true)
const isWide = ref(true)
let mql: MediaQueryList

function syncBp() {
  isWide.value = window.matchMedia('(min-width: 1400px)').matches
  if (isWide.value) show.value = false
}
onMounted(() => {
  mql = window.matchMedia('(min-width: 1400px)')
  syncBp()
  mql.addEventListener('change', syncBp)
})
onBeforeUnmount(() => mql?.removeEventListener('change', syncBp))

// ----- Teleport target handling
const toSelector = computed(() => (isWide.value ? '#inline-input-host' : '#drawer-host'))
const hostReady = ref(false)

// Keep hostReady true only when the destination actually exists
const checkHost = () => {
  const to = toSelector.value
  hostReady.value = typeof to === 'string' ? !!document.querySelector(to) : !!to
}

// Re-check when width or drawer visibility changes
watchEffect(() => {
  // When wide, #inline-input-host is in the WP column and should already exist
  // When narrow, the host appears only after the drawer mounts (when show becomes true)
  nextTick(checkHost)
})
</script>

<template>
  <n-button
    type="primary"
    class="input-toggle-btn"
    id="input-toggle-btn"
    strong
    primary
    round
    @click="show = true"
  >
    Muokkaa asetuksia
  </n-button>

  <!-- Keep DOM after first mount so state isn't lost when hiding -->
  <n-drawer
    v-model:show="show"
    placement="left"
    :width="420"
    display-directive="show"
    :trap-focus="false"
    :block-scroll="false"
  >
    <n-drawer-content title="Asetukset" closable>
      <!-- This only exists after the first time Drawer renders -->
      <div id="drawer-host"></div>
    </n-drawer-content>
  </n-drawer>

  <!-- Mount only when the destination exists -->
  <!-- If you're on Vue 3.5+, keep 'defer' to smooth target resolution -->
  <teleport v-if="hostReady" :to="toSelector" defer>
    <CalculationInputs />
  </teleport>
</template>

<style scoped>
.input-toggle-btn {
  position: fixed;
  right: 10px;
  bottom: 10px;
}
</style>
