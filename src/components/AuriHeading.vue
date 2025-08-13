<template>
  <component :is="tag" class="auri-heading" v-if="output.addressFromApi">
    <NIcon v-if="icon" class="auri-heading__icon" aria-hidden="true">
      <component :is="icon" />
    </NIcon>
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NH1, NH2, NH3, NH4, NH5, NH6, NIcon } from 'naive-ui'

import { useAppState } from '@/useAppState'
const { output } = useAppState()

// Import only the icons you want available
import {
  AiResults,
  Analytics,
  Angle,
  BatteryCharging,
  BatteryFull,
  BatteryHalf,
  BatteryQuarter,
  Building,
  BuildingInsights3,
  CalculationAlt,
  Calculator,
  CalculatorCheck,
  Calibrate,
  CarbonAccounting,
  CenterCircle,
  ChartClusterBar,
  ChartColumn,
  ChartLine,
  ChartLineData,
  Compass,
  Cost,
  CurrencyDollar,
  CurrencyEuro,
  DataBase,
  Delivery,
  Download,
  DownloadStudy,
  EnergyRenewable,
  FileStorage,
  Finance,
  Flash,
  GeneratePdf,
  Home,
  IncreaseLevel,
  Industry,
  Inspection,
  Location,
  LocationCompany,
  MachineLearningModel,
  Map,
  MapCenter,
  Maximize,
  Meter,
  MeterAlt,
  Money,
  Moon,
  PiggyBank,
  Plug,
  ReportData,
  Rocket,
  Save,
  Scales,
  Settings,
  SettingsAdjust,
  ShapeIntersect,
  SolarPanel,
  Sprout,
  Sun,
  ToolKit,
  Tools,
  TransmissionLte,
  WindowBase,
  WindowOverlay,
  WindPower,
  ZoomFit,
} from '@vicons/carbon'

const icons = {
  AiResults,
  Analytics,
  Angle,
  BatteryCharging,
  BatteryFull,
  BatteryHalf,
  BatteryQuarter,
  Building,
  BuildingInsights3,
  CalculationAlt,
  Calculator,
  CalculatorCheck,
  Calibrate,
  CarbonAccounting,
  CenterCircle,
  ChartClusterBar,
  ChartColumn,
  ChartLine,
  ChartLineData,
  Compass,
  Cost,
  CurrencyDollar,
  CurrencyEuro,
  DataBase,
  Delivery,
  Download,
  DownloadStudy,
  EnergyRenewable,
  FileStorage,
  Finance,
  Flash,
  GeneratePdf,
  Home,
  IncreaseLevel,
  Industry,
  Inspection,
  Location,
  LocationCompany,
  MachineLearningModel,
  Map,
  MapCenter,
  Maximize,
  Meter,
  MeterAlt,
  Money,
  Moon,
  PiggyBank,
  Plug,
  ReportData,
  Rocket,
  Save,
  Scales,
  Settings,
  SettingsAdjust,
  ShapeIntersect,
  SolarPanel,
  Sprout,
  Sun,
  ToolKit,
  Tools,
  TransmissionLte,
  WindowBase,
  WindowOverlay,
  WindPower,
  ZoomFit,
}

// Type hint for icon prop
type IconName = keyof typeof import('@vicons/carbon')

const props = defineProps<{
  level?: number
  icon?: IconName
}>()

const headingComponents = {
  1: NH1,
  2: NH2,
  3: NH3,
  4: NH4,
  5: NH5,
  6: NH6,
}

const tag = computed(() => {
  const lvl = Math.min(6, Math.max(1, props.level ?? 1))
  return headingComponents[lvl]
})

const icon = computed(() => {
  if (!props.icon) return null
  const searchName = props.icon.toLowerCase()
  const match = Object.entries(icons).find(([name]) => name.toLowerCase() === searchName)
  return match ? match[1] : null
})
</script>

<style scoped>
.auri-heading {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.auri-heading__icon {
  line-height: 0;
  flex: 0 0 auto;
}
</style>
