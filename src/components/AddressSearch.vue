<template>
  <n-form-item :label="label">
    <n-input-group>
      <n-auto-complete
        v-model:value="localValue"
        :options="suggestions"
        :input-props="{ autocomplete: 'off' }"
        :placeholder="placeholder"
        @input="getSuggestions"
        @select="onSelect"
      />
      <n-button type="primary" @click="emit('search', localValue)">Hae</n-button>
    </n-input-group>
  </n-form-item>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NFormItem, NInputGroup, NAutoComplete, NButton } from 'naive-ui'

type SuggestionItem = { label: string; value: string; placeId?: string }

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    label?: string
    apiKey?: string
  }>(),
  {
    placeholder: 'Syötä osoite',
    label: 'Osoite',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'search', address: string): void
  (e: 'select', payload: { value: string; placeId?: string }): void
}>()

const localValue = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    localValue.value = v
  },
)
watch(localValue, (v) => emit('update:modelValue', v))

const suggestions = ref<SuggestionItem[]>([])

// You can keep your sessionToken logic here
let sessionToken: google.maps.places.AutocompleteSessionToken | undefined

async function getSuggestions() {
  try {
    if (!localValue.value) {
      suggestions.value = []
      return
    }

    // create a fresh token for each input stream
    sessionToken = new google.maps.places.AutocompleteSessionToken()
    const autos = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: localValue.value,
      includedRegionCodes: ['fi'],
      language: 'fi',
      sessionToken,
    })

    suggestions.value = (autos.suggestions || []).map((s: any) => {
      const fullText = s.placePrediction?.text.text ?? ''
      const cleanText = fullText.replace(/, Suomi$/, '')
      const placeId = s.placePrediction?.placeId ?? ''
      return { label: cleanText, value: cleanText, placeId }
    })
  } catch (e) {
    console.error('autocomplete failed', e)
    suggestions.value = []
  }
}

function onSelect(value: string) {
  const hit = suggestions.value.find((s) => s.value === value)
  emit('select', { value, placeId: hit?.placeId })
}
</script>
