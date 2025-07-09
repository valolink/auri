<template>
  <div class="input-container">
    <n-form>
      <n-form-item label="Osoite">
        <n-input-group>
          <n-auto-complete
            v-model:value="input.address"
            :options="suggestions"
            placeholder="Syötä osoite"
            :input-props="{ autocomplete: 'off' }"
            @input="getSuggestions"
            :on-select="runSearch"
          />
          <n-button type="primary" @click="runSearch">Hae</n-button>
        </n-input-group>
      </n-form-item>
      <div v-if="output.technicalMax.panelsCount">
        <n-form-item v-if="role == 'admin'" label="Extra radius">
          <n-input-number v-model:value="input.extraRadius" :min="0" :step="10" size="small" />
        </n-form-item>
        <n-form-item label="Vaihda rakennus kartalta:">
          <n-button @click="enableManualBuildingSelect">Lisää click-event karttaan</n-button>
        </n-form-item>
        <div style="height: 20px"></div>
        <n-form-item :label="settings.calculationBasis.label">
          <div style="display: flex; flex-wrap: wrap; gap: 8px">
            <n-button
              v-for="option in settings.calculationBasis.options"
              :key="option.value"
              :type="input.calculationBasis.value === option.value ? 'primary' : 'default'"
              @click="updateCalculationBasis(option)"
              :disabled="loading && option.value === 'optimized'"
            >
              {{ option.label }}
            </n-button>
          </div>
        </n-form-item>

        <n-switch v-model:value="input.customProfile.active" />
        <n-form-item v-if="!input.customProfile.active" :label="input.buildingType?.label">
          <n-select
            v-if="input.buildingType"
            v-model:value="input.buildingType.value"
            :options="settings.buildingTypes.value"
            @update:value="updateCalculationBasis(input.calculationBasis)"
          />
        </n-form-item>
        <!-- Monthly Distribution Input -->
        <n-form-item v-if="input.customProfile.active" label="Kuukausittainen jakauma">
          <div>
            <n-flex>
              <template v-for="(month, index) in monthNames" :key="index">
                <n-input-number
                  style="width: 180px"
                  v-model:value="monthlyValues[index]"
                  :min="0"
                  :step="1"
                  :precision="1"
                  size="small"
                  @update:value="updateCalculationBasis(input.calculationBasis)"
                >
                  <template #prefix
                    ><span style="opacity: 0.5; width: 30px"> {{ month }}</span></template
                  >
                  <template #suffix>
                    <span style="opacity: 0.5"
                      >{{ (input.normalizedDistribution[index] * 101).toFixed(1) }} %</span
                    ></template
                  >
                </n-input-number>
              </template>
            </n-flex>
          </div>
        </n-form-item>
        <n-tag style="margin-bottom: 20px" size="small">{{
          input.customProfile.active ? input.normalizedDistribution : input.buildingType?.value
        }}</n-tag>
        <n-form-item :label="input.yearlyEnergyUsageKwh?.label">
          <n-space vertical>
            <n-slider
              v-if="input.yearlyEnergyUsageKwh"
              v-model:value="input.yearlyEnergyUsageKwh.value"
              :min="0"
              :max="100000"
              :step="10"
              @update:value="updateCalculationBasis(input.calculationBasis)"
            />
            <n-input-number
              v-if="input.yearlyEnergyUsageKwh"
              v-model:value="input.yearlyEnergyUsageKwh.value"
              :min="0"
              @update:value="updateCalculationBasis(input.calculationBasis)"
            />
          </n-space>
        </n-form-item>

        <n-form-item :label="input.targetPower?.label">
          <n-space vertical>
            <n-slider
              v-if="input.targetPower"
              v-model:value="input.targetPower.value"
              :min="0"
              :max="output.technicalMax?.capacityKwp"
              :step="1"
              @update:value="updateFromPower"
            />
            <n-input-number
              v-if="input.targetPower"
              v-model:value="input.targetPower.value"
              :min="0"
              T
              :max="output.technicalMax?.capacityKwp"
              :step="0.1"
              @update:value="updateFromPower"
            />
          </n-space>
        </n-form-item>

        <n-form-item :label="input.panelCount?.label">
          <n-space vertical>
            <n-slider
              v-if="input.panelCount"
              v-model:value="input.panelCount.value"
              :min="1"
              :max="output.technicalMax?.panelsCount"
              :step="1"
              @update:value="updateFromPanels"
            />
            <n-input-number
              v-if="input.panelCount"
              v-model:value="input.panelCount.value"
              :min="1"
              :max="output.technicalMax?.panelsCount"
              :step="5"
              @update:value="updateFromPanels"
            />
          </n-space>
        </n-form-item>
        <n-button type="primary" :disabled="loading" @click="requestPdf">Tulosta raportti</n-button>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import {
  NCard,
  NForm,
  NAutoComplete,
  NFormItem,
  NSelect,
  NInputNumber,
  NButton,
  NInputGroup,
  NSlider,
  NSpace,
  NTag,
  NSwitch,
  NFlex,
} from 'naive-ui'
import { useAppState } from '@/useAppState'
import { updateEnergyChart, updateSavingsChart } from '@/services/chartUtils'
import { requestPdf } from '@/services/pdfService'
import { getLayerData, getGeo, getBuildingData, renderPanels } from '@/services/useSolarApi'
import type { GeocodeLatLng } from '@/services/geocodingApi'
import { formatFinnishAddress, reverseGeocode } from '@/services/geocodingApi'
import { initMap, loadGoogleMaps } from '@/services/mapService'
import { ref, onMounted, computed } from 'vue'
import {
  calculateConfig,
  findOptimized,
  findSmartMax,
  findConfigWithPanelCount,
  findTechnicalMax,
  calculateScoreProduction,
} from '@/services/configUtils'

const { mapRef, mapInstance, loading, settings, input, output, buildingData, role } = useAppState()
const panelCapacity = 400 // watts per panel

input.buildingTypeLabel = computed(() => {
  const selectedOption = settings.buildingTypes.value.find(
    (option) => option.value === input.buildingType.value,
  )
  return selectedOption ? selectedOption.label : ''
})

const monthNames = [
  'Tam',
  'Hel',
  'Maa',
  'Huh',
  'Tou',
  'Kes',
  'Hei',
  'Elo',
  'Syy',
  'Lok',
  'Mar',
  'Jou',
]

const monthlyValues = ref([9.1, 8.4, 8.7, 8.1, 7.8, 7.4, 7.7, 7.9, 8.1, 8.6, 8.8, 9.3])

input.normalizedDistribution = computed(() => {
  const sum = monthlyValues.value.reduce((acc, val) => acc + (val || 0), 0)
  if (sum === 0) return new Array(12).fill(0)
  return monthlyValues.value.map((val) => Math.round(((val || 0) / sum) * 1000) / 1000)
})
let sessionToken: google.maps.places.AutocompleteSessionToken

const suggestions = ref<{ label: string; value: string }[]>([])
async function getSuggestions() {
  console.log(input.address)
  sessionToken = new google.maps.places.AutocompleteSessionToken()
  const autos = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: input.address,
    includedRegionCodes: ['fi'],
    language: 'fi', // or 'fi-FI'
    sessionToken,
  })
  console.log(autos)
  suggestions.value = autos.suggestions.map((s) => {
    const fullText = s.placePrediction?.text.text ?? ''
    // Remove ", Suomi" from the end
    const cleanText = fullText.replace(/, Suomi$/, '')
    return {
      label: cleanText,
      value: cleanText,
    }
  })
}
onMounted(async () => {
  await loadGoogleMaps()
  console.log(mapRef.value)
})

const runSearch = async (address: string = input.address) => {
  loading.value = true
  getSolarData(await getGeo(address))
}

const enableManualBuildingSelect = async () => {
  console.log(mapRef.value)
  if (mapInstance.value) {
    const listener = mapInstance.value.addListener(
      'click',
      async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()

        // Remove this listener to prevent repeated triggers
        google.maps.event.removeListener(listener)

        loading.value = true
        console.log({ lat: lat, lng: lng })

        // Perform reverse geocoding to get address information
        const apiKey = 'AIzaSyBf1PZHkSB3LPI4sdepIKnr9ItR_Gc_KT4' // TODO: Move to config
        const coordinates = await reverseGeocode(lat, lng, apiKey)

        await getSolarData(coordinates)
      },
    )
  }
}

const getSolarData = async (coordinates: GeocodeLatLng) => {
  //TODO clear data
  output.addressFromApi = formatFinnishAddress(coordinates.addressComponents)

  await getBuildingData(coordinates)

  await initMap(output.buildingCenter.lat, output.buildingCenter.lng, output.buildingRadius)

  output.technicalMax = calculateConfig(findTechnicalMax())
  output.smartMax = calculateConfig(findSmartMax())
  // updateCalculationBasis(
  //   settings.calculationBasis.options.find((option) => option.value === 'smartMax')!,
  // )
  const layerRadius = Math.ceil(output.buildingRadius * 1.0)
  await getLayerData(output.buildingCenter, layerRadius + input.extraRadius)
  // await getLayerData(output.buildingCenter, layerRadius)
  updateCalculationBasis(
    settings.calculationBasis.options.find((option) => option.value === 'smartMax')!,
  )
  output.scoreProduction = calculateScoreProduction(output.smartMax.panelsCount)
  loading.value = false
}

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
  updateCalculationBasis(
    settings.calculationBasis.options.find((option) => option.value === 'targetPower')!,
    false,
  )
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
  updateCalculationBasis(
    settings.calculationBasis.options.find((option) => option.value === 'targetPower')!,
    false,
  )
}

input.energyProfile = computed(() =>
  input.customProfile.active ? input.normalizedDistribution : JSON.parse(input.buildingType.value),
)

const updateCalculationBasis = (
  option: { value: string; label: string },
  updatePanelInput: boolean = true,
) => {
  const optionUnchanged = option == input.calculationBasis
  input.calculationBasis = option
  output.calculationBasis = option
  if (option.value == 'smartMax') {
    const smartMax = calculateConfig(findSmartMax())
    output.active = smartMax
    input.panelCount.value = smartMax.panelsCount
    input.targetPower.value = parseFloat(((smartMax.panelsCount * panelCapacity) / 1000).toFixed(2))
  } else if (option.value == 'technicalMax') {
    const technicalMax = calculateConfig(findTechnicalMax())
    output.active = technicalMax
    input.panelCount.value = technicalMax.panelsCount
    input.targetPower.value = parseFloat(
      ((technicalMax.panelsCount * panelCapacity) / 1000).toFixed(2),
    )
  } else if (option.value == 'optimized') {
    const optimized = calculateConfig(
      findOptimized(input.yearlyEnergyUsageKwh.value, input.energyProfile),
    )
    output.active = optimized
    input.panelCount.value = optimized.panelsCount
    input.targetPower.value = parseFloat(
      ((optimized.panelsCount * panelCapacity) / 1000).toFixed(2),
    )
  } else if (option.value == 'targetPower') {
    if (updatePanelInput && !optionUnchanged) {
      input.panelCount.value = 20
      updateFromPanels()
    } else {
      const targetConfig = findConfigWithPanelCount(input.panelCount.value)!
      output.active = calculateConfig(targetConfig)
    }
  }
  renderPanels()
  if (output.monthlyDistribution.length > 0) updateEnergyChart()
  updateSavingsChart()
  // console.log('chartRef.value: ', chartRef.value.chart)
}
</script>

<style scoped>
.input-container {
  padding: 1rem;
  max-width: 600px;
  margin: auto;
}
</style>
