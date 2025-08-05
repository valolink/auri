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

    <ResultItem
      :data="output.active.paybackYears"
      unit="vuotta" :round="1" :significant="4"
    >Takaisinmaksuaika
    </ResultItem>

    <ResultItem
      :data="output.active.savingsYear1"
      unit="€/vuosi" :round="0" :significant="4"
    >Vuosisäästö
    </ResultItem>

    <ResultItem
      :data="output.active.lcoeSntPerKwh"
      unit="snt/kWh" :round="2" :significant="4"
    >Aurinkosähkön omakustannushinta (LCOE)
    </ResultItem>

    <ResultItem
      :data="output.active.netPresentValueEuros"
      unit="€" :round="0" :significant="4"
    >Nettonykyarvo (30v)
    </ResultItem>

    <ResultItem
      :data="output.active.internalRateOfReturn"
      unit="%" :round="1" :significant="4"
    >Sisäinen korkokanta
    </ResultItem>

    <ResultItem
      :data="output.active.selfSufficiencyRate"
      unit="%" :round="0" :significant="4"
    >Omavaraisuusaste
    </ResultItem>

    <ResultItem
      :data="output.scorePotential"
      unit="/100" :round="0" :significant="4"
    >Potentiaali
    </ResultItem>

    <ResultItem
      :data="output.active.scoreUtilization"
      unit="/100" :round="0" :significant="4"
    >Katon hyödyntäminen
    </ResultItem>

    <ResultItem
      :data="output.active.scoreProfitability"
      unit="/100" :round="0" :significant="4"
    >Kannattavuus
    </ResultItem>

    <ResultItem
      :data="output.active.scoreProduction"
      unit="/100" :round="0" :significant="4"
    >Tuotantoteho
    </ResultItem>
  </div>
</template>
<script setup lang="ts">
import { useAppState } from '@/useAppState'
const { output } = useAppState()
import ResultItem from '@/components/ResultItem.vue'
</script>
