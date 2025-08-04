<template>
  <div>
    <!-- Plant capacity -->
    <ResultItem :data="output.active.capacityKwp" unit="kWp" :round="0" :significant="4">
      Voimalateho
    </ResultItem>

    <!-- Panel count -->
    <ResultItem :data="output.active.panelsCount" unit="kpl" :round="0"> Paneelimäärä</ResultItem>

    <!-- Annual energy yield -->
    <ResultItem :data="output.active.yearlyEnergyAcKwh" unit="kWh" :round="0" :significant="4">
      Aurinkosähkön vuosituotto
    </ResultItem>

    <!-- Estimated installation cost -->
    <ResultItem :data="output.active.installationCostEuros" unit="€" :round="0" :significant="4">
      Arvioitu investointihinta
    </ResultItem>

    <!-- Carbon footprint reduction -->
    <ResultItem
      :data="output.active.yearlyCarbonOffset"
      unit="kgCO2/vuosi"
      :round="0"
      :significant="4"
    >
      Vaikutus hiilijalanjälkeen
    </ResultItem>

    <!-- Annual maintenance cost -->
    <ResultItem :data="output.active.maintenanceCostsPerYear" unit="€/vuosi" :round="0">
      Ylläpitokulut vuodessa
    </ResultItem>

    <!-- Annual excess energy -->
    <ResultItem
      :data="output.active.yearlyExcessEnergyAcKwh"
      unit="kWh"
      :round="0"
      :significant="4"
    >
      Ylijäämä vuosittain
    </ResultItem>

    <!-- Annual self-use energy -->
    <ResultItem
      :data="output.active.yearlySelfUseEnergyAcKwh"
      unit="kWh"
      :round="0"
      :significant="4"
    >
      Omakäyttö vuosittain
    </ResultItem>
  </div>
</template>
<script setup>
import { useAppState } from '@/useAppState'
const { output } = useAppState()
import ResultItem from '@/components/ResultItem.vue'
</script>
