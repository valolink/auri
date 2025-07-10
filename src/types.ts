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
  yearlyEnergyUsageKwh: NumberSetting
  totalCapacityKwp: TextSetting
  targetPower: NumberSetting
  panelCount: NumberSetting
  calculationBasis: SelectSetting
  powerConsumptionProfile: SelectSetting
  energyPriceSnt: NumberSetting
  transmissionPriceSnt: NumberSetting
  electricityTax: NumberSetting
  vat: NumberSetting
  costIncreaseFactor: NumberSetting
  efficiencyDepreciationFactor: NumberSetting
  excessRate: NumberSetting
  excessSalePriceSnt: NumberSetting
  installationCostPerKwp: NumberSetting
  incentives: NumberSetting
  loan: NumberSetting
  loanDurationYears: NumberSetting
  interestRate: NumberSetting
  inverterReplacementCostFactor: NumberSetting
  maintenanceCostFactor: NumberSetting
  installationLifeSpan: NumberSetting
  endOfLifeCost: NumberSetting
  emissionsFactor: NumberSetting
  minYearlyEnergyPerPanelAdded: NumberSetting
  panelCapacityWatts: NumberSetting
  discountRate: NumberSetting
  dailyMaxUtilizationFactor: NumberSetting
  buildingTypes: RepeaterSetting
  buildingType: TextSetting
  enable_feature: CheckboxSetting
  welcome_message: TextareaSetting
  smartMaxRangeStart: NumberSetting
  smartMaxRangeEnd: NumberSetting
  smartMaxTreshold: NumberSetting
  smartMaxFallbackTreshold: NumberSetting
  dcToAcDerate: NumberSetting
}

export interface SolarCalculationResult {
  yearlyEnergyDcKwh: number
  panelsCount: number
  capacityKwp: number
  yearlyCarbonOffset: number
  savingsYear1: number
  installationCostEuros: number
  maintenanceCostsPerLifeSpan: number
  totalEnergyDcKwhPerLifeSpan: number
  totalSavingsPerLifeSpan: number
  averageYearlySavingsEuros: number
  totalFinanceCostsPerLifeSpan: number
  lcoeSntPerKwh: number
  paybackYears: number
  totalCostsPerLifeSpanEuros: number
  calculationMonth?: number
  dcToAcDerate: number
  yearlyEnergyAcKwh: number
  maintenanceCostsPerYear: number
  internalRateOfReturn: number
  scoreProfitability: number
  scoreProduction: number
  netPresentValueEuros: number
  yearlySavingsRate: number
  netCashFlowCumulative: number[]
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
