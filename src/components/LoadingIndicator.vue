<template>
  <div v-if="loading" style="text-align: center">
    <slot></slot>
    <n-spin size="large" />
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '@/useAppState'
import { NSpin } from 'naive-ui'

const { loading } = useAppState()
</script>
