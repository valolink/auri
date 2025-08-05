<template>
  <div v-if="props.data" class="result-item">
    <span class="label"><slot />: </span>
    <span class="value"
      ><b>
        {{ formattedValue }}
      </b>
    </span>
    <span v-if="unit">&nbsp;{{ unit }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: [String, Number],
    default: '',
  },
  unit: {
    type: String,
    default: '',
  },
  round: {
    type: Number, // Decimal places
    default: null,
  },
  significant: {
    type: Number, // Significant digits
    default: null,
  },
})

const formattedValue = computed(() => {
  const value = Number(props.data)

  // Return as-is if not a number
  if (isNaN(value)) return props.data

  let result = value

  // Apply significant digits first if specified
  if (props.significant !== null) {
    result = Number(result.toPrecision(props.significant))
  }

  // Apply rounding to decimals
  if (props.round !== null) {
    result = Number(result.toFixed(props.round))
  }

  return result
})
</script>
<style scoped>
.result-item {
  font-size: 14px;
}
</style>
