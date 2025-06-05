<template>
  <div class="input-container">
    <n-form>
      <n-form-item label="Osoite">
        <n-input-group>
          <n-input
            v-model:value="input.address"
            type="text"
            placeholder="Syötä osoite"
            :style="{ width: '75%' }"
          />
          <n-button type="primary" @click="runSolarApi">Hae</n-button>
        </n-input-group>
      </n-form-item>

      <n-form-item :label="settings.calculationBasis.label">
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <n-button
            v-for="option in settings.calculationBasis.options"
            :key="option.value"
            :type="input.calculationBasis.value === option.value ? 'primary' : 'default'"
            @click="changeCalculationBasis(option)"
          >
            {{ option.label }}
          </n-button>
        </div>
      </n-form-item>

      <n-form-item :label="input.buildingType.label">
        <n-select
          v-model:value="input.buildingType.value"
          :options="settings.buildingTypes.value"
          @update:value="updateOptimized"
        />
      </n-form-item>
      <n-tag style="margin-bottom: 20px" size="small">{{ input.buildingType.value }}</n-tag>
      <n-form-item :label="input.yearlyEnergyUsageKwh.label">
        <n-space vertical>
          <n-slider
            v-model:value="input.yearlyEnergyUsageKwh.value"
            :min="0"
            :max="100000"
            :step="10"
            @update:value="updateOptimized"
          />
          <n-input-number
            v-model:value="input.yearlyEnergyUsageKwh.value"
            :min="0"
            @update:value="updateOptimized"
          />
        </n-space>
      </n-form-item>

      <n-form-item :label="input.targetPower.label">
        <n-space vertical>
          <n-slider
            v-model:value="input.targetPower.value"
            :min="0"
            :max="output.technicalMax?.capacityKwp"
            :step="1"
            @update:value="updateFromPower"
          />
          <n-input-number
            v-model:value="input.targetPower.value"
            :min="0"
            :max="output.technicalMax?.capacityKwp"
            :step="0.1"
            @update:value="updateFromPower"
          />
        </n-space>
      </n-form-item>

      <n-form-item :label="input.panelCount.label">
        <n-space vertical>
          <n-slider
            v-model:value="input.panelCount.value"
            :min="1"
            :max="output.technicalMax?.panelsCount"
            :step="1"
            @update:value="updateFromPanels"
          />
          <n-input-number
            v-model:value="input.panelCount.value"
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
import {
  NForm,
  NFormItem,
  NSelect,
  NInputNumber,
  NInput,
  NButton,
  NInputGroup,
  NSlider,
  NSpace,
  NTag,
} from 'naive-ui'
import { useAppState } from '@/useAppState'
import { runSolarApi, renderPanels } from '@/services/useSolarApi'
import { calculateOptimized, updatePanelConfig } from '@/services/configUtils'
import { computed } from 'vue'
const { settings, input, output, buildingData } = useAppState()

const panelCapacity = 400 // watts per panel

const validPanelCounts = computed(
  () => buildingData?.sortedConfigs?.map((config) => config.panelsCount) || [],
)

const updateFromPower = () => {
  if (!input.targetPower || !input.panelCount || !validPanelCounts.value.length) return

  const estimatedCount = Math.round((input.targetPower.value * 1000) / panelCapacity)

  // Snap to closest valid panel count
  const closestCount = validPanelCounts.value.reduce((prev, curr) =>
    Math.abs(curr - estimatedCount) < Math.abs(prev - estimatedCount) ? curr : prev,
  )

  input.panelCount.value = closestCount
  updatePanelConfig()
  renderPanels()

  if (closestCount == output.smartMax?.panelsCount) {
    input.calculationBasis.value = 'smartMax'
  } else if (closestCount == output.technicalMax?.panelsCount) {
    input.calculationBasis.value = 'technicalMax'
  } else if (closestCount == output.optimized?.panelsCount) {
    input.calculationBasis.value = 'optimized'
  } else {
    input.calculationBasis.value = 'targetPower'
  }
  console.log(output.smartMax?.panelsCount == closestCount)
  console.log(closestCount)
}

const updateOptimized = () => {
  calculateOptimized()
}

const updateFromPanels = () => {
  if (!input.panelCount || !input.targetPower || !validPanelCounts.value.length) return

  const enteredCount = input.panelCount.value

  // Snap to closest valid count
  const closestCount = validPanelCounts.value.reduce((prev, curr) =>
    Math.abs(curr - enteredCount) < Math.abs(prev - enteredCount) ? curr : prev,
  )

  if (closestCount !== enteredCount) {
    input.panelCount.value = closestCount
  }

  // Update corresponding power
  input.targetPower.value = parseFloat(((closestCount * panelCapacity) / 1000).toFixed(2))

  updatePanelConfig()
  renderPanels()
}

const changeCalculationBasis = (option) => {
  console.log('option', typeof option.value)
  input.calculationBasis = option
  if (option.value == 'smartMax') {
    output.active = output.smartMax
    input.panelCount.value = output.smartMax.panelsCount
    input.targetPower.value = output.smartMax.capacityKwp
  } else if (output.value == 'technicalMax') {
    output.active = output.technicalMax
    input.panelCount.value = output.technicalMax.panelsCount
    input.targetPower.value = output.technicalMax.capacityKwp
  } else if (output.value == 'optimized') {
  } else {
    input.panelCount.value = 10
    updateFromPanels()
  }
  output.calculationBasis = option
  renderPanels()
}
</script>

<style scoped>
.input-container {
  padding: 1rem;
  max-width: 600px;
  margin: auto;
}
</style>
