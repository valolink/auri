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
            :on-select="handleSelect"
          />
          <n-button type="primary" @click="runSearch(input.address)">Hae</n-button>
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

        <n-switch
          v-model:value="input.customProfile.active"
          @update:value="updateCalculationBasis(input.calculationBasis)"
        />
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
                      >{{ (normalizedDistribution[index] * 101).toFixed(1) }} %</span
                    ></template
                  >
                </n-input-number>
              </template>
            </n-flex>
          </div>
        </n-form-item>
        <n-tag style="margin-bottom: 20px" size="small">{{
          input.customProfile.active ? 'Custom Profile' : input.buildingType?.value
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
        <n-button type="primary" :disabled="loading" @click="ajaxRequest('pdf_report')"
          >Tulosta raportti</n-button
        >
        <n-button
          v-if="role == 'admin'"
          type="primary"
          :disabled="loading"
          @click="ajaxRequest('save_to_database')"
          >Tallenna tietokantaan</n-button
        >
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import {
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
import { resetCharts, updateEnergyChart, updateSavingsChart } from '@/services/chartUtils'
import { ajaxRequest } from '@/services/pdfService'
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

function updateBuildingTypeLabel() {
  const selectedOption = settings.buildingTypes.value.find(
    (option) => option.value === input.buildingType.value,
  )
  console.log('input.customProfile.active', input.customProfile.active)
  if (input.customProfile.active) {
    input.buildingTypeLabel = 'Räätälöity kulutusprofiili'
  } else {
    input.buildingTypeLabel = selectedOption ? selectedOption.label : ''
  }
}

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

const normalizedDistribution = computed(() => {
  const sum = monthlyValues.value.reduce((acc, val) => acc + (val || 0), 0)
  if (sum === 0) return new Array(12).fill(0)
  return monthlyValues.value.map((val) => Math.round(((val || 0) / sum) * 1000) / 1000)
})
let sessionToken: google.maps.places.AutocompleteSessionToken

interface SuggestionItem {
  label: string
  value: string
  placeId?: string
}

const suggestions = ref<SuggestionItem[]>([])
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
    const cleanText = fullText.replace(/, Suomi$/, '')
    const placeId = s.placePrediction?.placeId ?? ''
    return {
      label: cleanText,
      value: cleanText,
      placeId: placeId,
    }
  })
}
onMounted(async () => {
  await loadGoogleMaps()
  console.log(mapRef.value)
})

// Function to get place details using place ID with the new REST API
async function getPlaceDetails(placeId: string) {
  try {
    const apiKey = settings.apiKey.value
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,formattedAddress,location,types&languageCode=fi&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const place = await response.json()

    return {
      name: place.displayName?.text || '',
      address: place.formattedAddress || '',
      location: place.location || null,
      types: place.types || [],
    }
  } catch (error) {
    console.error('Error fetching place details:', error)
    return null
  }
}

const runSearch = async (address: string = input.address) => {
  output.reset()
  resetCharts()
  loading.value = true
  getSolarData(await getGeo(address))
}

async function handleSelect(selectedValue: string) {
  runSearch(selectedValue)
  const selectedSuggestion = suggestions.value.find((s) => s.value === selectedValue)

  if (selectedSuggestion && selectedSuggestion.placeId) {
    const placeDetails = await getPlaceDetails(selectedSuggestion.placeId)
    if (placeDetails) {
      console.log('Place name:', placeDetails.name)
      console.log('Full address:', placeDetails.address)
      console.log('Location:', placeDetails.location)
      console.log('Types:', placeDetails.types)
      output.placeNameFromApi = placeDetails.name
    }
  }
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
        output.reset()
        resetCharts()
        console.log({ lat: lat, lng: lng })

        // Perform reverse geocoding to get address information
        const coordinates = await reverseGeocode(lat, lng, settings.apiKey.value)

        await getSolarData(coordinates)
      },
    )
  }
}

const getSolarData = async (coordinates: GeocodeLatLng) => {
  //TODO clear data
  output.addressFromApi = formatFinnishAddress(coordinates.addressComponents)

  await getBuildingData(coordinates)

  if (output.buildingCenter.lat !== null && output.buildingCenter.lng !== null) {
    await initMap(output.buildingCenter.lat, output.buildingCenter.lng, output.buildingRadius)
  }

  output.technicalMax = calculateConfig(findTechnicalMax())
  output.smartMax = calculateConfig(findSmartMax())
  // updateCalculationBasis(
  //   settings.calculationBasis.options.find((option) => option.value === 'smartMax')!,
  // )
  const layerRadius = Math.ceil(output.buildingRadius * 1.0)
  // Create a proper GeocodeLatLng object from buildingCenter
  const layerCoordinates: GeocodeLatLng = {
    lat: output.buildingCenter.lat!,
    lng: output.buildingCenter.lng!,
    formattedAddress: output.addressFromApi,
    addressComponents: coordinates.addressComponents,
  }
  await getLayerData(layerCoordinates, layerRadius + input.extraRadius)
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

const energyProfile = computed(() =>
  input.customProfile.active
    ? normalizedDistribution.value
    : JSON.parse(input.buildingType?.value || '[]'),
)

const updateCalculationBasis = (
  option: { value: string; label: string },
  updatePanelInput: boolean = true,
) => {
  updateBuildingTypeLabel()
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
      findOptimized(input.yearlyEnergyUsageKwh.value, energyProfile.value),
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
  if (output.monthlyDistribution.length > 0) {
    updateEnergyChart(
      output.active.yearlyEnergyDcKwh,
      output.monthlyDistribution,
      input.yearlyEnergyUsageKwh.value,
      energyProfile.value,
    )
  }
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
