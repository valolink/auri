<?php
if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('AuriappReportsAdmin')) {
    class AuriappReportsAdmin {

        public function __construct() {
            add_action('admin_menu', [$this, 'add_admin_menu']);
        }

        public function add_admin_menu() {
            add_submenu_page(
                'auriapp-settings',                   // parent slug
                'Solar Reports',                      // page title
                'Solar Reports',                      // menu title
                'manage_options',                     // capability
                'auriapp-solar-reports',              // menu slug
                [$this, 'render_reports_admin_page']  // callback
            );
        }

        public function render_reports_admin_page() {
            ?>
            <div class="wrap">
                <h1 class="wp-heading-inline">Solar Reports</h1>
                <p><a href="<?php echo esc_url(
                    admin_url('admin-post.php?action=auriapp_export_reports_csv&_wpnonce=' . wp_create_nonce('export_reports_csv'))
                ); ?>" class="page-title-action">Download CSV export</a></p>
            </div>
            <?php
        }

    }
}

new AuriappReportsAdmin();
