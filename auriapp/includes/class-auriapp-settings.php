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
		add_submenu_page(
			'auriapp-settings',                      // parent slug
			'Auriapp Settings',                      // page title
			'Auriapp Settings',                      // submenu title shown under "Auriapp"
			'manage_options',
			'auriapp-settings',                      
			[$this, 'auriapp_settings_create_admin_page']
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
		$sanitary_values = [];
		$fields = $this->get_fields_config();

		foreach ($fields as $field) {
			$id   = $field['id'];
			$type = $field['type'] ?? 'text';
			$primary_cb = $field['sanitize'] ?? 'sanitize_text_field';
			$supports_secondary = !empty($field['secondary']);
			$secondary_key = $id . '_secondary_val';

			if ($type === 'checkbox') {
				$sanitary_values[$id] = isset($input[$id]) ? 1 : 0;
				continue;
			}

			if ($type === 'repeater') {
				$sanitary_values[$id] = [];
				if (!empty($input[$id]) && is_array($input[$id])) {
					foreach ($input[$id] as $item) {
						$sanitary_values[$id][] = [
							'label' => sanitize_text_field($item['label'] ?? ''),
							'value' => sanitize_text_field($item['value'] ?? ''),
						];
					}
				}
				continue;
			}

			// Primary scalar-like fields (text/email/url/number/textarea/select)
			$primary_raw = $input[$id] ?? '';
			$sanitary_values[$id] = call_user_func($primary_cb, $primary_raw);

			// Secondary textarea (flat storage under id_secondary_val)
			if ($supports_secondary) {
				$secondary_raw = $input[$secondary_key] ?? '';
				$sanitary_values[$secondary_key] = sanitize_textarea_field($secondary_raw);
			}
		}

		return $sanitary_values;
	}

	public function auriapp_settings_section_info() {
		echo 'Modify the settings below:';
	}

	public function render_field($field) {
		$options = $this->auriapp_settings_options ?? [];
		$id = esc_attr($field['id']);
		$name_base = "auriapp_settings_option_name";
		$description = isset($field['description']) ? '<p class="description">' . esc_html($field['description']) . '</p>' : '';
		$supports_secondary = !empty($field['secondary']);
		$secondary_label = $supports_secondary && !empty($field['secondary']['label'])
			? $field['secondary']['label']
			: 'Secondary';

		$primary_val   = $options[$field['id']] ?? '';
		$secondary_key = $field['id'] . '_secondary_val';
		$secondary_val = $options[$secondary_key] ?? '';

		switch ($field['type']) {
			case 'textarea':
				printf(
					'<textarea class="large-text" id="%s" name="%s[%s]">%s</textarea>',
					$id,
					$name_base,
					esc_attr($field['id']),
					esc_textarea($primary_val)
				);
				echo $description;
				if ($supports_secondary) {
					printf(
						'<p style="margin-top:8px; width:350px;"><label><strong>%s</strong></label><br><textarea class="large-text" rows="3" name="%s[%s]">%s</textarea></p>',
						esc_html($secondary_label),
						$name_base,
						esc_attr($secondary_key),
						esc_textarea($secondary_val)
					);
				}
				break;

			case 'checkbox':
				printf(
					'<input type="checkbox" id="%s" name="%s[%s]" value="1" %s> %s',
					$id,
					$name_base,
					esc_attr($field['id']),
					checked((int)$primary_val, 1, false),
					$description
				);
				break;

			case 'select':
				echo '<select id="' . $id . '" name="' . $name_base . '[' . esc_attr($field['id']) . ']">';
				foreach ($field['options'] as $option_value => $option_label) {
					printf(
						'<option value="%s" %s>%s</option>',
						esc_attr($option_value),
						selected($primary_val, $option_value, false),
						esc_html($option_label)
					);
				}
				echo '</select>';
				echo $description;
				if ($supports_secondary) {
					printf(
						'<p style="margin-top:8px; width:350px;"><label><strong>%s</strong></label><br><textarea class="large-text" rows="3" name="%s[%s]">%s</textarea></p>',
						esc_html($secondary_label),
						$name_base,
						esc_attr($secondary_key),
						esc_textarea($secondary_val)
					);
				}
				break;

			case 'repeater':
				$rows = is_array($primary_val) ? $primary_val : array(array('label' => '', 'value' => ''));
				echo '<div id="' . $id . '_repeater">';
				foreach ($rows as $index => $row) {
					$label_val = esc_attr($row['label'] ?? '');
					$value_val = esc_attr($row['value'] ?? '');
					echo '<div class="repeater-row" style="margin-bottom: 10px;">';
					printf(
						'<input type="text" placeholder="Label" name="%s[%s][%d][label]" value="%s" class="regular-text" style="margin-right:10px;">',
						$name_base, esc_attr($field['id']), $index, $label_val
					);
					printf(
						'<input type="text" placeholder="Value" name="%s[%s][%d][value]" value="%s" class="regular-text">',
						$name_base, esc_attr($field['id']), $index, $value_val
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
					'<input class="regular-text" type="number" id="%s" name="%s[%s]" value="%s" %s>',
					$id, $name_base, esc_attr($field['id']), esc_attr($primary_val), $step
				);
				echo $description;
				if ($supports_secondary) {
					printf(
						'<p style="margin-top:8px; width:350px;"><label><strong>%s</strong></label><br><textarea class="large-text" rows="3" name="%s[%s]">%s</textarea></p>',
						esc_html($secondary_label), $name_base, esc_attr($secondary_key), esc_textarea($secondary_val)
					);
				}
				break;

			case 'text':
			case 'email':
			case 'url':
			default:
				printf(
					'<input class="regular-text" type="%s" id="%s" name="%s[%s]" value="%s">',
					esc_attr($field['type']), $id, $name_base, esc_attr($field['id']), esc_attr($primary_val)
				);
				echo $description;
				if ($supports_secondary) {
					printf(
						'<p style="margin-top:8px; width:350px;"><label><strong>%s</strong></label><br><textarea class="large-text" rows="3" name="%s[%s]">%s</textarea></p>',
						esc_html($secondary_label), $name_base, esc_attr($secondary_key), esc_textarea($secondary_val)
					);
				}
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
