<template>
  <component :is="tag" class="auri-heading" v-if="output.addressFromApi">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { useAppState } from '@/useAppState'
const { output } = useAppState()
import { computed } from 'vue'

const props = defineProps({
  level: {
    type: Number,
    default: 1,
    validator: (value) => value >= 1 && value <= 6,
  },
})

// Compute the tag name dynamically (e.g., "h1", "h2", ..., "h6")
const tag = computed(() => `h${props.level}`)
</script>

<style scoped>
h1.auri-heading {
  font-size: 2.25rem;
}
h2.auri-heading {
  font-size: 2rem;
}
h3.auri-heading {
  font-size: 1.75rem;
}
h4.auri-heading {
  font-size: 1.5rem;
}
h5.auri-heading {
  font-size: 1.25rem;
}
h6.auri-heading {
  font-size: 1rem;
}
</style>
