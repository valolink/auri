export interface BaseSetting {
  label: string
  description: string
  sanitize: string
}

export interface TextSetting extends BaseSetting {
  type: 'text'
  value: string
}

export interface NumberSetting extends BaseSetting {
  type: 'number'
  value: number
}

export interface SelectSetting extends BaseSetting {
  type: 'select'
  value: string
  options: { label: string; value: string }[]
}

export interface TextareaSetting extends BaseSetting {
  type: 'textarea'
  value: string
}

export interface CheckboxSetting extends BaseSetting {
  type: 'checkbox'
  value: boolean
}

export interface RepeaterSetting extends BaseSetting {
  type: 'repeater'
  value: { label: string; value: string }[]
}

export interface AppSettings {
  apiKey: TextSetting
  buildingType: TextSetting
  buildingTypes: RepeaterSetting
  calculationBasis: SelectSetting
  costIncreaseFactor: NumberSetting
  dailyMaxUtilizationFactor: NumberSetting
  dcToAcDerate: NumberSetting
  discountRate: NumberSetting
  efficiencyDepreciationFactor: NumberSetting
  electricityTax: NumberSetting
  emissionsFactor: NumberSetting
  enable_feature: CheckboxSetting
  endOfLifeCost: NumberSetting
  energyPriceSnt: NumberSetting
  excessRate: NumberSetting
  excessSalePriceSnt: NumberSetting
  incentives: NumberSetting
  installationCostPerKwp: NumberSetting
  installationLifeSpan: NumberSetting
  interestRate: NumberSetting
  inverterReplacementCostFactor: NumberSetting
  loan: NumberSetting
  loanDurationYears: NumberSetting
  maintenanceCostFactor: NumberSetting
  minYearlyEnergyPerPanelAdded: NumberSetting
  panelCapacityWatts: NumberSetting
  panelCount: NumberSetting
  powerConsumptionProfile: SelectSetting
  smartMaxFallbackTreshold: NumberSetting
  smartMaxRangeEnd: NumberSetting
  smartMaxRangeStart: NumberSetting
  smartMaxTreshold: NumberSetting
  targetPower: NumberSetting
  totalCapacityKwp: TextSetting
  transmissionPriceSnt: NumberSetting
  vat: NumberSetting
  welcome_message: TextareaSetting
  yearlyEnergyUsageKwh: NumberSetting
}

export interface SolarCalculationResult {
  averageYearlySavingsEuros: number
  calculationMonth?: number
  capacityKwp: number
  installationCostEuros: number
  internalRateOfReturn: number
  lcoeSntPerKwh: number
  maintenanceCostsPerLifeSpan: number
  maintenanceCostsPerYear: number
  netCashFlowCumulative: number[]
  netPresentValueEuros: number
  panelsCount: number
  paybackYears: number
  savingsYear1: number
  scoreProduction: number
  scoreProfitability: number
  selfSufficiencyRate: number
  totalCostsPerLifeSpanEuros: number
  totalEnergyAcKwhPerLifeSpan: number
  totalFinanceCostsPerLifeSpan: number
  totalSavingsPerLifeSpan: number
  yearlyCarbonOffset: number
  yearlyEnergyAcKwh: number
  yearlyEnergyDcKwh: number
  yearlyExcessEnergyAcKwh: number
  yearlySavingsRate: number
  yearlySelfUseEnergyAcKwh: number
}

// Extended SolarPanelConfig with calculated properties
export interface ExtendedSolarPanelConfig {
  panelsCount: number
  yearlyEnergyDcKwh: number
  roofSegmentSummaries: {
    pitchDegrees: number
    azimuthDegrees: number
    panelsCount: number
    yearlyEnergyDcKwh: number
    segmentIndex: number
  }[]
  gainPerPanel: number
}
