<?php
class AuriappSettings {
	private $auriapp_settings_options;

	public function __construct() {
		add_action('admin_menu', array($this, 'auriapp_settings_add_plugin_page'));
		add_action('admin_init', array($this, 'auriapp_settings_page_init'));
		add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
	}
	
	public function enqueue_admin_scripts() {
		wp_enqueue_script('auriapp-repeater-js', plugin_dir_url(__FILE__) . 'repeater.js', array('jquery'), null, true);
	}

	public function auriapp_settings_add_plugin_page() {
		add_menu_page(
			'Auriapp Settings',
			'Auriapp',
			'manage_options',
			'auriapp-settings',
			array($this, 'auriapp_settings_create_admin_page'),
			'dashicons-admin-generic',
			80
		);
	}

	public function auriapp_settings_create_admin_page() {
		$this->auriapp_settings_options = get_option('auriapp_settings_option_name'); ?>
		<div class="wrap">
			<h2>Auriapp Settings</h2>
			<?php settings_errors(); ?>
			<form method="post" action="options.php">
				<?php
				settings_fields('auriapp_settings_option_group');
				do_settings_sections('auriapp-settings-admin');
				submit_button();
				?>
			</form>
		</div>
	<?php }

	public function auriapp_settings_page_init() {
		register_setting(
			'auriapp_settings_option_group',
			'auriapp_settings_option_name',
			array($this, 'auriapp_settings_sanitize')
		);

		add_settings_section(
			'auriapp_settings_setting_section',
			'Settings',
			array($this, 'auriapp_settings_section_info'),
			'auriapp-settings-admin'
		);

		$fields = $this->get_fields_config();
		foreach ($fields as $field) {
			add_settings_field(
				$field['id'],
				$field['label'] . ',<br><span style="font-weight:400;">' . $field['id']. '</span>',
				function () use ($field) {
					$this->render_field($field);
				},
				'auriapp-settings-admin',
				'auriapp_settings_setting_section'
			);
		}
	}

	public function auriapp_settings_sanitize($input) {
		$sanitary_values = array();
		$fields = $this->get_fields_config();

		foreach ($fields as $field) {
			if (isset($input[$field['id']])) {
				$callback = $field['sanitize'] ?? 'sanitize_text_field';
				$sanitary_values[$field['id']] = call_user_func($callback, $input[$field['id']]);
			} else {
				// Handle unchecked checkboxes
				if ($field['type'] === 'checkbox') {
					$sanitary_values[$field['id']] = 0;
				}
			}
			if ($field['type'] === 'repeater') {
				$sanitary_values[$field['id']] = array();
				foreach ($input[$field['id']] as $item) {
					$sanitary_values[$field['id']][] = array(
						'label' => sanitize_text_field($item['label'] ?? ''),
						'value' => sanitize_text_field($item['value'] ?? '')
					);
				}
			}
		}
		return $sanitary_values;
	}

	public function auriapp_settings_section_info() {
		echo 'Modify the settings below:';
	}

	public function render_field($field) {
		$value = $this->auriapp_settings_options[$field['id']] ?? '';
		$id = esc_attr($field['id']);
		$name = "auriapp_settings_option_name[$id]";
		$description = isset($field['description']) ? '<p class="description">' . esc_html($field['description']) . '</p>' : '';

		switch ($field['type']) {
			case 'textarea':
				printf(
					'<textarea class="large-text" id="%s" name="%s">%s</textarea>%s',
					$id,
					$name,
					esc_textarea($value),
					$description
				);
				break;

			case 'checkbox':
				printf(
					'<input type="checkbox" id="%s" name="%s" value="1" %s> %s',
					$id,
					$name,
					checked($value, 1, false),
					$description
				);
				break;

			case 'select':
				echo '<select id="' . $id . '" name="' . $name . '">';
				foreach ($field['options'] as $option_value => $option_label) {
					printf(
						'<option value="%s" %s>%s</option>',
						esc_attr($option_value),
						selected($value, $option_value, false),
						esc_html($option_label)
					);
				}
				echo '</select>' . $description;
				break;
				
			case 'repeater':
				$rows = is_array($value) ? $value : array(array('name' => '', 'value' => ''));
				echo '<div id="' . $id . '_repeater">';
				foreach ($rows as $index => $row) {
					$label_val = esc_attr($row['label'] ?? '');
					$value_val = esc_attr($row['value'] ?? '');
					echo '<div class="repeater-row" style="margin-bottom: 10px;">';
					printf(
						'<input type="text" placeholder="Label" name="%s[%d][label]" value="%s" class="regular-text" style="margin-right:10px;">',
						esc_attr($name),
						$index,
						$label_val
					);
					printf(
						'<input type="text" placeholder="Value" name="%s[%d][value]" value="%s" class="regular-text">',
						esc_attr($name),
						$index,
						$value_val
					);
					echo ' <button type="button" class="button remove-row">Remove</button>';
					echo '</div>';
				}
				echo '</div>';
				echo '<button type="button" class="button" onclick="addRepeaterRow(\'' . esc_js($id) . '\')">Add Row</button>';
				echo $description;
				break;

			case 'number':
				$step = isset($field['step']) ? 'step="' . esc_attr($field['step']) . '"' : '';
				printf(
					'<input class="regular-text" type="number" id="%s" name="%s" value="%s" %s>%s',
					$id,
					$name,
					esc_attr($value),
					$step,
					$description
				);
				break;

			case 'text':
			case 'email':
			case 'url':
			default:
				printf(
					'<input class="regular-text" type="%s" id="%s" name="%s" value="%s">%s',
					esc_attr($field['type']),
					$id,
					$name,
					esc_attr($value),
					$description
				);
		}
	}

	private function get_fields_config() {
		$config_path = plugin_dir_path(__FILE__) . 'auriapp-settings.json';
		if (!file_exists($config_path)) {
			return [];
		}
		$json = file_get_contents($config_path);
		return json_decode($json, true) ?? [];
	}
}

// Instantiate if in admin
if (is_admin()) {
	new AuriappSettings();
}
