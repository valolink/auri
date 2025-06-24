<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.2;
        color: #333;
        background: white;
      }

      .container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
      }

      .app-info h1 {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .version-info {
        font-size: 10px;
        color: #666;
      }

      .scores {
        text-align: right;
        font-size: 11px;
      }

      .scores div {
        margin-bottom: 3px;
      }

      .variable {
        color: #e74c3c;
        font-weight: bold;
      }

      .main-content {
        display: flex;
        gap: 30px;
        margin-bottom: 30px;
      }

      .left-panel {
        flex: 1;
      }

      .right-panel {
        flex: 1;
      }

      .section-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #333;
      }

      .address-section {
        margin-bottom: 25px;
      }

      .address-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .address-details {
        font-size: 10px;
        color: #666;
      }

      .system-specs {
        margin-bottom: 25px;
      }

      .spec-item {
        margin-bottom: 5px;
        font-size: 11px;
      }

      .spec-label {
        color: #333;
      }

      .spec-value {
        color: #e74c3c;
        font-weight: bold;
      }

      .spec-unit {
        color: #333;
        font-weight: normal;
      }

      .heat-map {
        width: 100%;
        height: 200px;
        border: 1px solid #ddd;
        margin-bottom: 10px;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
      }

      .chart-container {
        width: 100%;
        margin-bottom: 30px;
      }

      .chart-title {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #2ecc71;
      }

      .chart-placeholder {
        width: 100%;
        height: 200px;
        border: 1px solid #ddd;
        background: #f9f9f9;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
      }

      .bottom-section {
        display: flex;
        gap: 30px;
        margin-top: 30px;
      }

      .lifecycle-chart {
        flex: 1;
      }

      .profitability-section {
        flex: 1;
      }

      .profitability-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
      }

      .profit-item {
        margin-bottom: 8px;
        font-size: 11px;
      }

      .profit-label {
        color: #333;
      }

      .profit-value {
        color: #e74c3c;
        font-weight: bold;
      }

      .calculations-section {
        margin-top: 30px;
      }

      .calc-columns {
        display: flex;
        gap: 30px;
      }

      .calc-column {
        flex: 1;
      }

      .calc-item {
        margin-bottom: 6px;
        font-size: 10px;
      }

      .calc-label {
        color: #333;
      }

      .calc-value {
        color: #e74c3c;
        font-weight: bold;
      }

      .image-placeholder {
        background: #f0f0f0;
        border: 2px dashed #ccc;
        color: #666;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="app-info">
          <h1>AuriApp</h1>
          <div class="version-info">
            Versio <span class="variable"><?php echo $versionNumber; ?></span><br />
            <span class="variable"><?php echo $currentDate; ?></span>
          </div>
        </div>
        <div class="scores">
          <div><strong>Arviointipisteet</strong></div>
          <div>
            Kannattavuus <span class="variable"><?php echo $scoreProfitability; ?></span>/100
          </div>
          <div>
            Tuotanto <span class="variable"><?php echo $scoreProduction; ?></span>/100
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="left-panel">
          <!-- Address Section -->
          <div class="address-section">
            <div class="section-title">Kohde</div>
            <div class="address-title">
              <span class="variable"><?php echo $address; ?></span> (input)
            </div>
            <div class="address-details">
              Lat: <span class="variable"><?php echo $lat; ?></span> (geocode), Lon:
              <span class="variable"><?php echo $lng; ?></span> (geocode)
            </div>
          </div>

          <!-- System Specifications -->
          <div class="system-specs">
            <div class="section-title">Järjestelmätiedot</div>

            <div class="spec-item">
              <span class="spec-label">Voimatalteho:</span>
              <span class="spec-value"><?php echo $capacityKwp; ?></span>
              <span class="spec-unit">kWp</span>
            </div>

            <div class="spec-item">
              <span class="spec-label">Paneelimäärä:</span>
              <span class="spec-value"><?php echo $panelsCount; ?></span>
              <span class="spec-unit">kpl</span>
            </div>

            <div class="spec-item">
              <span class="spec-label">Aurinkosähkön vuosituotto:</span>
              <span class="spec-value"><?php echo $yearlyEnergyDcKwh; ?></span>
              <span class="spec-unit">kWh</span>
            </div>

            <div class="spec-item">
              <span class="spec-label">Arvoitu investointihinta:</span>
              <span class="spec-value"><?php echo $installationCostEuros; ?></span>
              <span class="spec-unit">€</span>
            </div>

            <div class="spec-item">
              <span class="spec-label">Vaikutus hiilijalanjälkeen:</span>
              <span class="spec-value">-<?php echo $yearlyCarbonOffset; ?></span>
              <span class="spec-unit">kgCO2/vuosi</span>
            </div>

            <div class="spec-item">
              <span class="spec-label">Ylläpitokulut vuodessa:</span>
              <span class="spec-value"><?php echo $maintenanceCostsPerYear; ?></span>
              <span class="spec-unit">€/vuosi</span>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <!-- Heat Map -->
          <div class="heat-map image-placeholder">
            <?php if(isset($heatMapImage)): ?>
            <img
              src="data:image/png;base64,<?php echo $heatMapImage; ?>"
              style="width: 100%; height: 100%; object-fit: contain"
            />
            <?php else: ?> Heat Map Image Placeholder <?php endif; ?>
          </div>
        </div>
      </div>

      <!-- Solar Power Chart -->
      <div class="chart-container">
        <div class="chart-title">■ Solar power</div>
        <div class="chart-placeholder image-placeholder">
          <?php if(isset($solarChartImage)): ?>
          <img
            src="data:image/png;base64,<?php echo $solarChartImage; ?>"
            style="width: 100%; height: 100%; object-fit: contain"
          />
          <?php else: ?> Solar Power Chart Placeholder <?php endif; ?>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="bottom-section">
        <!-- Lifecycle Chart -->
        <div class="lifecycle-chart">
          <div class="section-title">Elinkaarisäästöt</div>
          <div class="chart-placeholder image-placeholder">
            <?php if(isset($lifecycleChartImage)): ?>
            <img
              src="data:image/png;base64,<?php echo $lifecycleChartImage; ?>"
              style="width: 100%; height: 100%; object-fit: contain"
            />
            <?php else: ?> Lifecycle Chart Placeholder <?php endif; ?>
          </div>
        </div>

        <!-- Profitability Section -->
        <div class="profitability-section">
          <div class="profitability-title">Kannattavuus</div>

          <div class="profit-item">
            <span class="profit-label">Takaisinmaksuaika:</span>
            <span class="profit-value"><?php echo $paybackYears; ?></span>
            <span class="profit-label">vuotta</span>
          </div>

          <div class="profit-item">
            <span class="profit-label">Vuosisäästö:</span>
            <span class="profit-value"><?php echo $averageYearlySavingsEuros; ?></span>
            <span class="profit-label">€/vuosi</span>
          </div>

          <div class="profit-item">
            <span class="profit-label">Aurinkosähkön omakustannushinta (LCOE):</span>
            <span class="profit-value"><?php echo $lcoeSntkPerKwh; ?></span>
            <span class="profit-label">snt/kWh</span>
          </div>

          <div class="profit-item">
            <span class="profit-label">Nettonykyarvo (30v):</span>
            <span class="profit-value"><?php echo $netPresentValueEuros; ?></span>
            <span class="profit-label">€</span>
          </div>

          <div class="profit-item">
            <span class="profit-label">Sisäinen korkokanta:</span>
            <span class="profit-value"><?php echo $internalRateOfReturn; ?></span>
            <span class="profit-label">%</span>
          </div>
        </div>
      </div>

      <!-- Calculations Section -->
      <div class="calculations-section">
        <div class="section-title">Laskentaoletukset</div>

        <div class="calc-columns">
          <div class="calc-column">
            <div class="calc-item">
              <span class="calc-label">Sähkön hinta:</span>
              <span class="calc-value"><?php echo $energyPriceSnt; ?></span>
              <span class="calc-label">snt/kWh</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Sähkön siirtohinta:</span>
              <span class="calc-value"><?php echo $transmissionPriceSnt; ?></span>
              <span class="calc-label">snt/kWh</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Sähkövero ja huoltovarmmusmaksu:</span>
              <span class="calc-value"><?php echo $electricityTaxSnt; ?></span>
              <span class="calc-label">snt/kWh</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Arvonlisävero:</span>
              <span class="calc-value"><?php echo $vat; ?></span>
              <span class="calc-label">%</span>
            </div>
          </div>

          <div class="calc-column">
            <div class="calc-item">
              <span class="calc-label">Ylläpitokulut vuodessa:</span>
              <span class="calc-value"><?php echo $maintenanceCostFactor; ?></span>
              <span class="calc-label">%</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">% investointikustannuksista</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Tehon alenema vuositain:</span>
              <span class="calc-value"><?php echo $efficiencyDepreciationFactor; ?></span>
              <span class="calc-label">%</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Järjestelmän elinkaari:</span>
              <span class="calc-value"><?php echo $installationLifeSpan; ?></span>
              <span class="calc-label">vuotta</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Paneelin teho:</span>
              <span class="calc-value"><?php echo $panelCapacityWatts; ?></span>
              <span class="calc-label">W</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Investointihinta per kWp:</span>
              <span class="calc-value"><?php echo $installationCostPerKwp; ?></span>
              <span class="calc-label">€/kWp</span>
            </div>
          </div>

          <div class="calc-column">
            <div class="calc-item">
              <span class="calc-label">Kalistuskulma:</span>
              <span class="calc-value"><?php echo $pitchDegrees; ?></span>
              <span class="calc-label">°</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Suuntaus:</span>
              <span class="calc-value"><?php echo $azimuthDegrees; ?></span>
              <span class="calc-label">°</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Diskonttokorkо:</span>
              <span class="calc-value"><?php echo $discountRate; ?></span>
              <span class="calc-label">%</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Sähkön hinnan nousu:</span>
              <span class="calc-value"><?php echo $costIncreaseFactor; ?></span>
              <span class="calc-label">%</span>
            </div>

            <div class="calc-item">
              <span class="calc-label">Ostos sähkön päästökerroin:</span>
              <span class="calc-value"><?php echo $emissionsFactor; ?></span>
              <span class="calc-label">gCO2/kWh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
