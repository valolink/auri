<?php
/*
Plugin Name: Auriapp
Plugin URI: valolink-auriapp
Description: 
Version: 0.1.1
Author: Valolink
Author URI: valolink.fi
License: 
License URI: 
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'AURIAPP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
require_once AURIAPP_PLUGIN_DIR . 'includes/class-auriapp-settings.php';
require_once AURIAPP_PLUGIN_DIR . 'includes/class-auriapp-reports-admin.php';

class VueAppShortcode {

	/**
	 * Plugin directory path.
	 *
	 * @var string
	 */
	private $plugin_path;

	/**
	 * Plugin directory URL.
	 *
	 * @var string
	 */
	private $plugin_url;

	/**
	 * Dist folder path.
	 *
	 * @var string
	 */
	private $dist_path;

	/**
	 * Dist folder URL.
	 *
	 * @var string
	 */
	private $dist_url;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->plugin_path = plugin_dir_path( __FILE__ );
		$this->plugin_url  = plugin_dir_url( __FILE__ );
		$this->dist_path   = $this->plugin_path . 'dist/assets/';
		$this->dist_url    = $this->plugin_url . 'dist/assets/';

		// Register the shortcode.
		add_shortcode( 'vue_app', array( $this, 'render_vue_app_shortcode' ) );

		// Enqueue assets if the shortcode is used on the page.
		add_action( 'wp_enqueue_scripts', array( $this, 'conditionally_enqueue_assets' ) );
	}

	/**
	 * Check if the current post has the shortcode and enqueue assets if so.
	 */
	public function conditionally_enqueue_assets() {
		// Only check on singular posts or pages.
		if ( is_singular() && has_shortcode( get_post()->post_content, 'vue_app' ) ) {
			$this->enqueue_assets();
		}
	}
	
	private function build_keyed_settings(): array {
		// Load settings config
		$settings_json_path = plugin_dir_path(__FILE__) . 'includes/auriapp-settings.json';
		$settings_fields = [];
		if ( file_exists( $settings_json_path ) ) {
			$settings_json   = file_get_contents( $settings_json_path );
			$settings_fields = json_decode( $settings_json, true ) ?? [];
		}

		// Load stored values
		$stored_values = get_option( 'auriapp_settings_option_name', [] );

		$keyed_settings = [];
		foreach ( $settings_fields as $field ) {
			$field_id           = $field['id'];
			$supports_secondary = ! empty( $field['secondary'] );
			$secondary_key      = $field_id . '_secondary_val';

			$keyed = [
				'label'       => $field['label'] ?? '',
				'type'        => $field['type'] ?? 'text',
				'sanitize'    => $field['sanitize'] ?? 'sanitize_text_field',
				'description' => $field['description'] ?? '',
				'value'       => $stored_values[ $field_id ] ?? ( ( $field['type'] ?? '' ) === 'checkbox' ? false : '' ),
			];

			// step passthrough (for number inputs)
			if ( isset( $field['step'] ) ) {
				$keyed['step'] = $field['step'];
			}

			// options passthrough (normalize to [{label, value}])
			if ( isset( $field['options'] ) && is_array( $field['options'] ) ) {
				$keyed['options'] = array_map(
					fn( $value, $label ) => [ 'label' => $label, 'value' => $value ],
					array_keys( $field['options'] ),
					array_values( $field['options'] )
				);
			}

			// secondary textarea payload
			if ( $supports_secondary ) {
				$keyed['secondary'] = [
					'label' => $field['secondary']['label'] ?? 'Secondary',
					'value' => $stored_values[ $secondary_key ] ?? '',
				];
			}

			$keyed_settings[ $field_id ] = $keyed;
		}

		return $keyed_settings;
	}

	/**
	 * Enqueue the Vue app's JS and CSS from the dist folder.
	 */
	private function enqueue_assets() {
		$css = $this->plugin_path . 'auriapp.css';
		if ( file_exists( $css ) ) {
			wp_enqueue_style(
				'auriapp-style',
				$this->plugin_url . 'auriapp.css',
				array(),
				filemtime( $css )
			);
		}
		
		// Check if ?script=local is present in the URL
		if ( isset( $_GET['script'] ) && $_GET['script'] === 'local' ) {
			// Enqueue the Vite dev server script
			wp_enqueue_script(
				'vue-app-local-script',
				'http://localhost:5173/src/main.ts',
				array(),
				null,
				true
			);

			// Localize the settings (includes secondary textarea values)
			wp_localize_script(
				'vue-app-local-script',
				'vueAppData',
				array(
					'ajax_url' => admin_url( 'admin-ajax.php' ),
					'role'     => current_user_can( 'manage_options' ) ? 'admin' : 'guest',
					'settings' => $this->build_keyed_settings(),
				)
			);

			// Add type="module" to script tag
			add_filter( 'script_loader_tag', array( $this, 'add_module_to_script' ), 10, 3 );

			return; // Skip normal asset loading
		}

		// Otherwise, load production assets
		$css_files = glob( $this->dist_path . '*.css' );
		if ( ! empty( $css_files ) ) {
			foreach ( $css_files as $css_file ) {
				$css_filename = basename( $css_file );
				wp_enqueue_style(
					'vue-app-style-' . sanitize_title( $css_filename ),
					$this->dist_url . $css_filename,
					array(),
					filemtime( $css_file )
				);
			}
		}

		$js_files = glob( $this->dist_path . 'index-*.js' );
		if ( ! empty( $js_files ) ) {
			foreach ( $js_files as $js_file ) {
				$js_filename = basename( $js_file );

				wp_enqueue_script(
					'vue-app-script-' . sanitize_title( $js_filename ),
					$this->dist_url . $js_filename,
					array(),
					filemtime( $js_file ),
					true
				);

				// Localize the settings (includes secondary textarea values)
				wp_localize_script(
					'vue-app-script-' . sanitize_title( $js_filename ),
					'vueAppData',
					array(
						'ajax_url' => admin_url( 'admin-ajax.php' ),
						'role'     => current_user_can( 'manage_options' ) ? 'admin' : 'guest',
						'settings' => $this->build_keyed_settings(),
					)
				);

				// Add type="module" to script tag
				add_filter( 'script_loader_tag', array( $this, 'add_module_to_script' ), 10, 3 );
			}
		}
	}

	
	/**
	 * Add type="module" to specific scripts.
	 *
	 * @param string $tag    The original <script> tag.
	 * @param string $handle The script's registered handle.
	 * @param string $src    The script's source URL.
	 * @return string Modified script tag.
	 */
	public function add_module_to_script( $tag, $handle, $src ) {
		if ( str_starts_with( $handle, 'vue-app' ) ) {
			// Add type="module" attribute
			$tag = '<script type="module" src="' . esc_url( $src ) . '"></script>';
		}
		return $tag;
	}

	/**
	 * Shortcode callback that outputs the Vue app container.
	 *
	 * @param array  $atts    Shortcode attributes.
	 * @param string $content Enclosed content.
	 * @return string HTML markup.
	 */
	public function render_vue_app_shortcode( $atts, $content = null ) {
		// Return the container where the Vue app will mount.
		// return '<div id="app"></div>';
	}
}

require_once AURIAPP_PLUGIN_DIR . 'includes/class-auriapp-pdf.php';

// AJAX hooks for PDF generation
add_action('wp_ajax_pdf_report', 'auriapp_handle_pdf_report');
add_action('wp_ajax_nopriv_pdf_report', 'auriapp_handle_pdf_report'); // optional if public access needed
function auriapp_handle_pdf_report() {
	AuriappPDFGenerator::handle_ajax_request();
}

require_once AURIAPP_PLUGIN_DIR . 'includes/class-auriapp-database-storage.php';

add_action('wp_ajax_save_to_database', 'auriapp_handle_save_to_database');
add_action('wp_ajax_nopriv_save_to_database', 'auriapp_handle_save_to_database');
function auriapp_handle_save_to_database() {
	AuriappDatabaseStorage::handle_ajax_request();
}


add_action('admin_post_auriapp_export_reports_csv', 'auriapp_handle_csv_export');
function auriapp_handle_csv_export() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_admin_referer('export_reports_csv');

    require_once AURIAPP_PLUGIN_DIR . 'includes/class-auriapp-database-storage.php';
    $storage = new AuriappDatabaseStorage();
    $reports = $storage->get_reports(10000, 0);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="solar-reports.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $output = fopen('php://output', 'w');
	
	// UTF-8 BOM, for Excel
    fwrite($output, "\xEF\xBB\xBF");

    if (!empty($reports)) {
        fputcsv($output, array_keys($reports[0]));
        foreach ($reports as $report) {
			if (isset($report['postal_code'])) {
				$report['postal_code'] =  $report['postal_code'];
			}
            fputcsv($output, $report);
        }
    } else {
        fputcsv($output, ['No reports found.']);
    }

    fclose($output);
    exit;
}

// Hook to create table on plugin activation
register_activation_hook(__FILE__, ['AuriappDatabaseStorage', 'create_table']);

new VueAppShortcode();
