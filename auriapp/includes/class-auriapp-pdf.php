<?php
class SimpleTemplateEngine {
    
    /**
     * Process mustache-style template with data
     * 
     * @param string $template The template content
     * @param array $data Data to replace in template
     * @return string Processed template
     */
    public static function render($template, $data) {
        // Handle simple variable replacement {{variable}}
        $template = preg_replace_callback('/\{\{(\w+)\}\}/', function($matches) use ($data) {
            $key = $matches[1];
            return isset($data[$key]) ? htmlspecialchars($data[$key]) : '';
        }, $template);
        
        // Handle conditional blocks {{#variable}}...{{/variable}}
        $template = preg_replace_callback('/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/s', function($matches) use ($data) {
            $key = $matches[1];
            $content = $matches[2];
            
            if (isset($data[$key]) && !empty($data[$key])) {
                // If it's an array, loop through it
                if (is_array($data[$key])) {
                    $result = '';
                    foreach ($data[$key] as $item) {
                        $result .= self::render($content, is_array($item) ? $item : [$key => $item]);
                    }
                    return $result;
                } else {
                    // Simple conditional - show content if variable exists and is not empty
                    return self::render($content, $data);
                }
            }
            return '';
        }, $template);
        
        // Handle inverted conditional blocks {{^variable}}...{{/variable}}
        $template = preg_replace_callback('/\{\{\^(\w+)\}\}(.*?)\{\{\/\1\}\}/s', function($matches) use ($data) {
            $key = $matches[1];
            $content = $matches[2];
            
            if (!isset($data[$key]) || empty($data[$key])) {
                return self::render($content, $data);
            }
            return '';
        }, $template);
        
        return $template;
    }
}

class AuriappPDFGenerator {
    
    public function handle_pdf_request() {
        // Verify nonce if you're using one
        // if (!wp_verify_nonce($_POST['nonce'], 'pdf_nonce')) {
        //     wp_die('Security check failed');
        // }

        try {
            // Extract all form data
            $data = $this->extract_form_data();
            
            // Process images
            $images = $this->process_uploaded_images();
            
            // Generate PDF
            $pdf_url = $this->generate_pdf($data, $images);
            
            wp_send_json_success([
                'file_url' => $pdf_url,
                'message' => 'PDF generated successfully'
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => 'PDF generation failed: ' . $e->getMessage()
            ]);
        }
    }
    
    private function extract_form_data() {
        return [
            // Basic info
            'versionNumber' => sanitize_text_field($_POST['versionNumber'] ?? '1.0'),
            'currentDate' => sanitize_text_field($_POST['currentDate'] ?? date('d.m.Y')),
            'address' => sanitize_text_field($_POST['address'] ?? ''),
            
            // Location
            'lat' => floatval($_POST['lat'] ?? 0),
            'lng' => floatval($_POST['lng'] ?? 0),
            
            // Scores
            'scoreProfitability' => intval($_POST['scoreProfitability'] ?? 0),
            'scoreProduction' => intval($_POST['scoreProduction'] ?? 0),
            
            // System specifications
            'capacityKwp' => floatval($_POST['capacityKwp'] ?? 0),
            'panelsCount' => intval($_POST['panelsCount'] ?? 0),
            'yearlyEnergyDcKwh' => floatval($_POST['yearlyEnergyDcKwh'] ?? 0),
            'installationCostEuros' => floatval($_POST['installationCostEuros'] ?? 0),
            'yearlyCarbonOffset' => floatval($_POST['yearlyCarbonOffset'] ?? 0),
            'maintenanceCostsPerYear' => floatval($_POST['maintenanceCostsPerYear'] ?? 0),
            
            // Profitability
            'paybackYears' => floatval($_POST['paybackYears'] ?? 0),
            'averageYearlySavingsEuros' => floatval($_POST['averageYearlySavingsEuros'] ?? 0),
            'lcoeSntkPerKwh' => floatval($_POST['lcoeSntkPerKwh'] ?? 0),
            'netPresentValueEuros' => floatval($_POST['netPresentValueEuros'] ?? 0),
            'internalRateOfReturn' => floatval($_POST['internalRateOfReturn'] ?? 0),
            
            // Calculation parameters
            'energyPriceSnt' => floatval($_POST['energyPriceSnt'] ?? 0),
            'transmissionPriceSnt' => floatval($_POST['transmissionPriceSnt'] ?? 0),
            'electricityTaxSnt' => floatval($_POST['electricityTaxSnt'] ?? 0),
            'vat' => floatval($_POST['vat'] ?? 24),
            'maintenanceCostFactor' => floatval($_POST['maintenanceCostFactor'] ?? 0),
            'efficiencyDepreciationFactor' => floatval($_POST['efficiencyDepreciationFactor'] ?? 0),
            'installationLifeSpan' => intval($_POST['installationLifeSpan'] ?? 25),
            'panelCapacityWatts' => floatval($_POST['panelCapacityWatts'] ?? 0),
            'installationCostPerKwp' => floatval($_POST['installationCostPerKwp'] ?? 0),
            'pitchDegrees' => floatval($_POST['pitchDegrees'] ?? 0),
            'azimuthDegrees' => floatval($_POST['azimuthDegrees'] ?? 0),
            'discountRate' => floatval($_POST['discountRate'] ?? 0),
            'costIncreaseFactor' => floatval($_POST['costIncreaseFactor'] ?? 0),
            'emissionsFactor' => floatval($_POST['emissionsFactor'] ?? 0),
        ];
    }
    
    private function process_uploaded_images() {
        $images = [];
        
        // Process solar chart image
        if (isset($_FILES['solarChartImage']) && $_FILES['solarChartImage']['error'] === UPLOAD_ERR_OK) {
            $images['solarChartImage'] = base64_encode(file_get_contents($_FILES['solarChartImage']['tmp_name']));
        }
        
        // Process heat map image
        if (isset($_FILES['heatMapImage']) && $_FILES['heatMapImage']['error'] === UPLOAD_ERR_OK) {
            $images['heatMapImage'] = base64_encode(file_get_contents($_FILES['heatMapImage']['tmp_name']));
        }
        
        // Process lifecycle chart image
        if (isset($_FILES['lifecycleChartImage']) && $_FILES['lifecycleChartImage']['error'] === UPLOAD_ERR_OK) {
            $images['lifecycleChartImage'] = base64_encode(file_get_contents($_FILES['lifecycleChartImage']['tmp_name']));
        }
        
        return $images;
    }
    
    private function generate_pdf($data, $images) {
        // Combine data and images
        $templateData = array_merge($data, $images);
        
        // Load the HTML template
        $template_path = plugin_dir_path(__FILE__) . 'templates/pdf-template.html';
        
        if (!file_exists($template_path)) {
            throw new Exception('Template file not found: ' . $template_path);
        }
        
        $template = file_get_contents($template_path);
        
        if (empty($template)) {
            throw new Exception('Template file is empty or could not be read');
        }
        
        // Process template with data
        $html = SimpleTemplateEngine::render($template, $templateData);
        
        // Debug: Save processed HTML
        $debug_path = wp_upload_dir()['path'] . '/debug_template.html';
        file_put_contents($debug_path, $html);
        error_log('Debug template saved to: ' . $debug_path);
        
        // Generate PDF using dompdf
        require_once plugin_dir_path(__FILE__) . '../vendor/autoload.php';
        
        $options = new \Dompdf\Options();
        $options->set('defaultFont', 'Arial');
        $options->set('isRemoteEnabled', true);
        $options->set('isPhpEnabled', false); // Security
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isFontSubsettingEnabled', true);
        $options->set('debugKeepTemp', false); // Set to true for debugging
        
        // Set memory and time limits for large PDFs
        $options->set('chroot', get_template_directory());
        
        $dompdf = new \Dompdf\Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
       
        
        $dompdf->render();
        
        // Save PDF file
        $upload_dir = wp_upload_dir();
        $pdf_filename = 'solar_report_' . uniqid() . '.pdf';
        $pdf_path = $upload_dir['path'] . '/' . $pdf_filename;
        
        file_put_contents($pdf_path, $dompdf->output());
        
        return $upload_dir['url'] . '/' . $pdf_filename;
    }
    
    private function replace_template_variables($html, $data, $images) {
        // Start output buffering to capture PHP execution
        ob_start();
        
        // Extract variables for use in template
        extract($data);
        extract($images);
        
        // Execute the PHP template
        eval('?>' . $html);
        
        // Get the processed HTML
        $processed_html = ob_get_clean();
        
        return $processed_html;
    }
}

// Register AJAX handlers
add_action('wp_ajax_pdf_report', [new AuriappPDFGenerator(), 'handle_pdf_request']);
add_action('wp_ajax_nopriv_pdf_report', [new AuriappPDFGenerator(), 'handle_pdf_request']);
?>
