<?php
class AuriappDatabaseStorage {
    
    private $table_name;
	
	private static $columns = [
        // Basic info
        'version_number' => ['type' => 'varchar(50)', 'default' => 'NULL', 'post_key' => 'versionNumber'],
        'date' => ['type' => 'varchar(20)', 'default' => 'NULL', 'post_key' => 'currentDate'],
        'address' => ['type' => 'text', 'default' => 'NULL', 'post_key' => 'address'],
        'address_from_api' => ['type' => 'text', 'default' => 'NULL', 'post_key' => 'addressFromApi'],
        'postal_code' => ['type' => 'varchar(20)', 'default' => 'NULL', 'post_key' => 'postalCode'],
        'locality' => ['type' => 'varchar(255)', 'default' => 'NULL', 'post_key' => 'locality'],

        // Input
        'calculation_basis' => ['type' => 'varchar(255)', 'default' => 'NULL', 'post_key' => 'calculationBasis'],
        'yearly_energy_usage_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'yearlyEnergyUsageKwh', 'normalize' => true],
        'building_type' => ['type' => 'varchar(100)', 'default' => 'NULL', 'post_key' => 'buildingType'],
        'energy_profile' => ['type' => 'LONGTEXT', 'default' => 'NULL', 'post_key' => 'energyProfile'],

        // Location
        'lat' => ['type' => 'decimal(10,8)', 'default' => 'NULL', 'post_key' => 'lat'],
        'lng' => ['type' => 'decimal(11,8)', 'default' => 'NULL', 'post_key' => 'lng'],

        // Scores
        'score_profitability' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'scoreProfitability', 'normalize' => true],
        'score_production' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'scoreProduction', 'normalize' => true],
        'score_utilization' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'scoreUtilization', 'normalize' => true],
        'score_potential' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'scorePotential', 'normalize' => true],

        // System specifications
        'capacity_kwp' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'capacityKwp', 'normalize' => true],
        'panels_count' => ['type' => 'int', 'default' => 'NULL', 'post_key' => 'panelsCount', 'normalize' => true],
        'yearly_energy_ac_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'yearlyEnergyAcKwh', 'normalize' => true],
        'installation_cost_euros' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'installationCostEuros', 'normalize' => true],
        'yearly_carbon_offset' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'yearlyCarbonOffset', 'normalize' => true],
        'maintenance_costs_per_year' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'maintenanceCostsPerYear', 'normalize' => true],

        // Profitability
        'payback_years' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'paybackYears', 'normalize' => true],
        'savings_year1' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'savingsYear1', 'normalize' => true],
        'lcoe_sntk_per_kwh' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'lcoeSntkPerKwh', 'normalize' => true],
        'net_present_value_euros' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'netPresentValueEuros', 'normalize' => true],
        'internal_rate_of_return' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'internalRateOfReturn', 'normalize' => true],

        // Calculation parameters
        'energy_price_snt' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'energyPriceSnt', 'normalize' => true],
        'transmission_price_snt' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'transmissionPriceSnt', 'normalize' => true],
        'electricity_tax_snt' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'electricityTaxSnt', 'normalize' => true],
        'vat' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'vat', 'normalize' => true],
        'maintenance_cost_factor' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'maintenanceCostFactor', 'normalize' => true],
        'efficiency_depreciation_factor' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'efficiencyDepreciationFactor', 'normalize' => true],
        'installation_life_span' => ['type' => 'int', 'default' => 'NULL', 'post_key' => 'installationLifeSpan', 'normalize' => true],
        'panel_capacity_watts' => ['type' => 'int', 'default' => 'NULL', 'post_key' => 'panelCapacityWatts', 'normalize' => true],
        'installation_cost_per_kwp' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'installationCostPerKwp', 'normalize' => true],
        'pitch_degrees' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'pitchDegrees', 'normalize' => true],
        'azimuth_degrees' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'azimuthDegrees', 'normalize' => true],
        'discount_rate' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'discountRate', 'normalize' => true],
        'cost_increase_factor' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'costIncreaseFactor', 'normalize' => true],
        'emissions_factor' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'emissionsFactor', 'normalize' => true],
        'daily_max_utilization_factor' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'dailyMaxUtilizationFactor', 'normalize' => true],
        'excess_rate' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'excessRate', 'normalize' => true],
        'yearly_excess_energy_ac_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'yearlyExcessEnergyAcKwh', 'normalize' => true],
        'yearly_self_use_energy_ac_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'yearlySelfUseEnergyAcKwh', 'normalize' => true],
        'self_sufficiency_rate' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'selfSufficiencyRate', 'normalize' => true],
        'excess_sale_price_snt' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'excessSalePriceSnt', 'normalize' => true],
        'tilt_boost_factor' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'tiltBoostFactor', 'normalize' => true],

        // Other
        'area_meters2' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'areaMeters2', 'normalize' => true],
        'monthly_distribution' => ['type' => 'LONGTEXT', 'default' => 'NULL', 'post_key' => 'monthlyDistribution'],
		'building_id' => ['type' => 'varchar(60)', 'default' => 'NULL', 'post_key' => 'buildingId'],

        // Images
        'solar_chart_image' => ['type' => 'varchar(255)', 'default' => 'NULL', 'file_key' => 'solarChartImage'],
        'heat_map_image' => ['type' => 'varchar(255)', 'default' => 'NULL', 'file_key' => 'heatMapImage'],
        'lifecycle_chart_image' => ['type' => 'varchar(255)', 'default' => 'NULL', 'file_key' => 'lifecycleChartImage'],
		
		// smartMax
		'smart_score_profitability' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'smart_scoreProfitability', 'normalize' => true],
        'smart_score_production' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'smart_scoreProduction', 'normalize' => true],
		'smart_capacity_kwp' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'smart_capacityKwp', 'normalize' => true],
		'smart_panels_count' => ['type' => 'int', 'default' => 'NULL', 'post_key' => 'smart_panelsCount', 'normalize' => true],
		'smart_installation_cost_euros' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'smart_installationCostEuros', 'normalize' => true],
		'smart_yearly_energy_ac_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'smart_yearlyEnergyAcKwh', 'normalize' => true],
		'smart_yearly_carbon_offset' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'smart_yearlyCarbonOffset', 'normalize' => true],
		'smart_maintenance_costs_per_year' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'smart_maintenanceCostsPerYear', 'normalize' => true],
		'smart_payback_years' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'smart_paybackYears', 'normalize' => true],
		'smart_savings_year1' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'smart_savingsYear1', 'normalize' => true],
		'smart_lcoe_sntk_per_kwh' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'smart_lcoeSntkPerKwh', 'normalize' => true],
		'smart_net_present_value_euros' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'smart_netPresentValueEuros', 'normalize' => true],
		'smart_internal_rate_of_return' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'smart_internalRateOfReturn', 'normalize' => true],
		'smart_yearly_excess_energy_ac_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'smart_yearlyExcessEnergyAcKwh', 'normalize' => true],
		'smart_yearly_self_use_energy_ac_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'smart_yearlySelfUseEnergyAcKwh', 'normalize' => true],
		'smart_self_sufficiency_rate' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'smart_selfSufficiencyRate', 'normalize' => true],
		
		// technicalMax
		'technical_score_profitability' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'technical_scoreProfitability', 'normalize' => true],
        'technical_score_production' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'technical_scoreProduction', 'normalize' => true],
		'technical_capacity_kwp' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'technical_capacityKwp', 'normalize' => true],
		'technical_panels_count' => ['type' => 'int', 'default' => 'NULL', 'post_key' => 'technical_panelsCount', 'normalize' => true],
		'technical_installation_cost_euros' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'technical_installationCostEuros', 'normalize' => true],
		'technical_yearly_energy_ac_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'technical_yearlyEnergyAcKwh', 'normalize' => true],
		'technical_yearly_carbon_offset' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'technical_yearlyCarbonOffset', 'normalize' => true],
		'technical_maintenance_costs_per_year' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'technical_maintenanceCostsPerYear', 'normalize' => true],
		'technical_payback_years' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'technical_paybackYears', 'normalize' => true],
		'technical_savings_year1' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'technical_savingsYear1', 'normalize' => true],
		'technical_lcoe_sntk_per_kwh' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'technical_lcoeSntkPerKwh', 'normalize' => true],
		'technical_net_present_value_euros' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'technical_netPresentValueEuros', 'normalize' => true],
		'technical_internal_rate_of_return' => ['type' => 'decimal(5,2)', 'default' => 'NULL', 'post_key' => 'technical_internalRateOfReturn', 'normalize' => true],
		'technical_yearly_excess_energy_ac_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'technical_yearlyExcessEnergyAcKwh', 'normalize' => true],
		'technical_yearly_self_use_energy_ac_kwh' => ['type' => 'decimal(10,2)', 'default' => 'NULL', 'post_key' => 'technical_yearlySelfUseEnergyAcKwh', 'normalize' => true],
		'technical_self_sufficiency_rate' => ['type' => 'decimal(8,2)', 'default' => 'NULL', 'post_key' => 'technical_selfSufficiencyRate', 'normalize' => true],
    ];

    
    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'solar_reports';
    }
    
    /**
     * Create the solar reports table
     */
    public static function create_table() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'solar_reports';
        $charset_collate = $wpdb->get_charset_collate();

        $columns_sql = [
            "`id` mediumint(9) NOT NULL AUTO_INCREMENT",
            "`username` VARCHAR(255) DEFAULT NULL"
        ];

        foreach (self::$columns as $column => $meta) {
            $columns_sql[] = "`$column` {$meta['type']} DEFAULT {$meta['default']}";
        }

        $columns_sql[] = "`created_at` datetime DEFAULT CURRENT_TIMESTAMP";
        $columns_sql[] = "PRIMARY KEY (id)";

        $sql = "CREATE TABLE $table_name (\n" . implode(",\n", $columns_sql) . "\n) $charset_collate;";
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Handle database save request
     */
    public function handle_save_request() {
        // Verify nonce if you're using one
        // if (!wp_verify_nonce($_POST['nonce'], 'save_nonce')) {
        //     wp_die('Security check failed');
        // }

        try {
            // Extract all form data (reusing the same method)
            $data = $this->extract_form_data();
            
            // Process and save images
            $image_paths = $this->save_uploaded_images();
            
            // Save to database
            $report_id = $this->save_to_database($data, $image_paths);
            
            wp_send_json_success([
                'report_id' => $report_id,
                'message' => 'Report saved successfully'
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => 'Save failed: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Extract form data 
     */
    private function extract_form_data() {
        $data = [];
        foreach (self::$columns as $key => $meta) {
            if (isset($meta['post_key'])) {
                $data[$key] = sanitize_text_field($_POST[$meta['post_key']] ?? '');
            }
        }
        return $data;
    }
    
    /**
     * Save uploaded images
     */
    private function save_uploaded_images() {
        $upload_dir = wp_upload_dir();
        $save_dir = $upload_dir['basedir'] . '/solar-reports';
        $save_url = $upload_dir['baseurl'] . '/solar-reports';

        if (!file_exists($save_dir)) {
            wp_mkdir_p($save_dir);
        }

        $paths = [];
        $timestamp = time();

        foreach (self::$columns as $column => $meta) {
            if (!isset($meta['file_key'])) continue;

            $file_key = $meta['file_key'];
            if (!isset($_FILES[$file_key]) || $_FILES[$file_key]['error'] !== UPLOAD_ERR_OK) continue;

            $ext = pathinfo($_FILES[$file_key]['name'], PATHINFO_EXTENSION);
            $filename = "{$column}_{$timestamp}." . $ext;
            $file_path = $save_dir . '/' . $filename;

            if (move_uploaded_file($_FILES[$file_key]['tmp_name'], $file_path)) {
                $paths[$column] = $save_url . '/' . $filename;
            }
        }

        return $paths;
    }
	
	private function normalize_number($value) {
		// Remove any non-digit and non-dot/comma characters
		$normalized = str_replace([' ', "\u{00A0}"], '', $value); // handle regular and non-breaking spaces
		$normalized = str_replace(',', '.', $normalized); // replace comma with dot if needed
		return $normalized;
	}
    
    /**
     * Save data to database
     */
    private function save_to_database($data, $image_paths) {
        global $wpdb;

        $db_data = [
            'username' => is_user_logged_in() ? wp_get_current_user()->display_name : null,
        ];

        foreach (self::$columns as $key => $meta) {
            if (isset($meta['file_key'])) {
                $db_data[$key] = $image_paths[$key] ?? null;
            } elseif (isset($data[$key])) {
                $db_data[$key] = ($meta['normalize'] ?? false)
                    ? floatval($this->normalize_number($data[$key]))
                    : $data[$key];
            }
        }

        $result = $wpdb->insert($this->table_name, $db_data);

        if ($result === false) {
            throw new Exception('Database insertion failed: ' . $wpdb->last_error);
        }

        return $wpdb->insert_id;
    }
    
    /**
     * Get a report by ID
     */
    public function get_report($id) {
        global $wpdb;
        
        $report = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$this->table_name} WHERE id = %d", $id),
            ARRAY_A
        );
        
        return $report;
    }
    
    /**
     * Get all reports with pagination
     */
    public function get_reports($limit = 20, $offset = 0) {
        global $wpdb;
        
        $reports = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->table_name} ORDER BY created_at DESC LIMIT %d OFFSET %d",
                $limit,
                $offset
            ),
            ARRAY_A
        );
        
        return $reports;
    }
    
    /**
     * Delete a report and its associated images
     */
    public function delete_report($id) {
        global $wpdb;
        
        // Get the report first to get image paths
        $report = $this->get_report($id);
        
        if (!$report) {
            throw new Exception('Report not found');
        }
        
        // Delete image files
        $upload_dir = wp_upload_dir();
        $images = ['solar_chart_image', 'heat_map_image', 'lifecycle_chart_image'];
        
        foreach ($images as $image_field) {
            if (!empty($report[$image_field])) {
                $file_path = $upload_dir['basedir'] . '/' . $report[$image_field];
                if (file_exists($file_path)) {
                    unlink($file_path);
                }
            }
        }
        
        // Delete from database
        $result = $wpdb->delete(
            $this->table_name,
            ['id' => $id],
            ['%d']
        );
        
        if ($result === false) {
            throw new Exception('Database deletion failed: ' . $wpdb->last_error);
        }
        
        return true;
    }
}

// Register AJAX handlers
add_action('wp_ajax_save_to_database', [new AuriappDatabaseStorage(), 'handle_save_request']);
add_action('wp_ajax_nopriv_save_to_database', [new AuriappDatabaseStorage(), 'handle_save_request']);

?>