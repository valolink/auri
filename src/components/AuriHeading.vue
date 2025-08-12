<template>
  <component :is="tag" class="auri-heading" v-if="output.addressFromApi">
    <NIcon
      v-if="icon"
      :size="headingSizeMap[props.level]"
      class="auri-heading__icon"
      aria-hidden="true"
    >
      <component :is="icon" />
    </NIcon>
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon } from 'naive-ui'
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

// Map heading levels to font/icon sizes
const headingSizeMap: Record<number, number> = {
  1: 36, // matches ~2.25rem
  2: 32, // ~2rem
  3: 28, // ~1.75rem
  4: 24, // ~1.5rem
  5: 20, // ~1.25rem
  6: 16, // ~1rem
}

const tag = computed(() => `h${Math.min(6, Math.max(1, props.level ?? 1))}`)
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

.auri-heading__icon {
  line-height: 0;
  flex: 0 0 auto;
}
</style>
