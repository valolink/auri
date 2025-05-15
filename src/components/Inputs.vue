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
        <n-input-number v-model:value="settings.yearlyEnergyUsageKwh.value" :min="0" />
      </n-form-item>

      <n-form-item :label="settings.targetPower.label">
        <n-input-number
          v-model:value="settings.targetPower.value"
          :min="0"
          :step="0.01"
          @update:value="updateFromPower"
        />
      </n-form-item>

      <n-form-item :label="settings.panelCount.label">
        <n-input-number
          v-model:value="settings.panelCount.value"
          :min="1"
          :step="1"
          @update:value="updateFromPanels"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NSelect, NInputNumber, NInput, NButton, NInputGroup } from 'naive-ui'
import { useAppState } from '@/useAppState'
import { runSolarApi } from '@/services/useSolarApi'

const { settings } = useAppState()

const panelCapacity = 400 // watts per panel

const updateFromPower = () => {
  if (settings.targetPower && settings.panelCount) {
    settings.panelCount.value = Math.round((settings.targetPower.value * 1000) / panelCapacity)
  }
}

const updateFromPanels = () => {
  if (settings.panelCount && settings.targetPower) {
    settings.targetPower.value = parseFloat(
      ((settings.panelCount.value * panelCapacity) / 1000).toFixed(2),
    )
  }
}
</script>

<style scoped>
.input-container {
  padding: 1rem;
  max-width: 600px;
  margin: auto;
}
</style>
