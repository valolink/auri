<template>
  <div class="input-container">
    <n-form>
      <n-form-item label="Osoite">
        <n-input-group>
          <n-input
            v-model:value="settings.address"
            type="text"
            placeholder="Syötä osoite"
            :style="{ width: '75%' }"
          />
          <n-button type="primary" @click="runSolarApi">Hae</n-button>
        </n-input-group>
      </n-form-item>

      <n-form-item :label="settings.calculationBasis.label">
        <n-select
          v-model:value="settings.calculationBasis.value"
          :options="settings.calculationBasis.options"
          :placeholder="settings.calculationBasis.description"
        />
      </n-form-item>

      <n-form-item :label="settings.powerConsumptionProfile.label">
        <n-select
          v-model:value="settings.powerConsumptionProfile.value"
          :options="settings.powerConsumptionProfile.options"
          :placeholder="settings.powerConsumptionProfile.description"
        />
      </n-form-item>

      <n-form-item :label="settings.yearlyEnergyUsageKwh.label">
      <n-space vertical>
        <n-slider v-model:value="settings.yearlyEnergyUsageKwh.value" :min="0" :max="100000" :step="10"  />
          <n-input-number v-model:value="settings.yearlyEnergyUsageKwh.value" :min="0" />
        </n-space>
      </n-form-item>

      <n-form-item :label="settings.targetPower.label">
       <n-space vertical>
          <n-slider v-model:value="settings.targetPower.value" :min="0" :max="output.technicalMax?.capacityKwp" :step="1" @update:value="updateFromPower" />
          <n-input-number
            v-model:value="settings.targetPower.value"
            :min="0"
            :max="output.technicalMax?.capacityKwp"
            :step="0.1"
            @update:value="updateFromPower"
          />
        </n-space>
      </n-form-item>

      <n-form-item :label="settings.panelCount.label">
        <n-space vertical>
          <n-slider v-model:value="settings.panelCount.value" :min="1" :max="output.technicalMax?.panelsCount" :step="1" @update:value="updateFromPanels" />
          <n-input-number
            v-model:value="settings.panelCount.value"
            :min="1"
            :max="output.technicalMax?.panelsCount"
            :step="5"
            @update:value="updateFromPanels"
          />
        </n-space>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NSelect, NInputNumber, NInput, NButton, NInputGroup, NSlider, NSpace } from 'naive-ui'
import { useAppState } from '@/useAppState'
import { runSolarApi } from '@/services/useSolarApi'
import { updatePanelConfig } from '@/services/configUtils'
import { computed } from 'vue'
const { settings, output, buildingData } = useAppState()

const panelCapacity = 400 // watts per panel

const validPanelCounts = computed(() =>
  buildingData?.sortedConfigs?.map(config => config.panelsCount) || []
)

const updateFromPower = () => {
  if (!settings.targetPower || !settings.panelCount || !validPanelCounts.value.length) return

  const estimatedCount = Math.round((settings.targetPower.value * 1000) / panelCapacity)

  // Snap to closest valid panel count
  const closestCount = validPanelCounts.value.reduce((prev, curr) =>
    Math.abs(curr - estimatedCount) < Math.abs(prev - estimatedCount) ? curr : prev
  )

  settings.panelCount.value = closestCount
  updatePanelConfig()
}

const updateFromPanels = () => {
  if (!settings.panelCount || !settings.targetPower || !validPanelCounts.value.length) return

  const enteredCount = settings.panelCount.value

  // Snap to closest valid count
  const closestCount = validPanelCounts.value.reduce((prev, curr) =>
    Math.abs(curr - enteredCount) < Math.abs(prev - enteredCount) ? curr : prev
  )

  if (closestCount !== enteredCount) {
    settings.panelCount.value = closestCount
  }

  // Update corresponding power
  settings.targetPower.value = parseFloat(
    ((closestCount * panelCapacity) / 1000).toFixed(2)
  )

  updatePanelConfig()
}
</script>

<style scoped>
.input-container {
  padding: 1rem;
  max-width: 600px;
  margin: auto;
}
</style>
