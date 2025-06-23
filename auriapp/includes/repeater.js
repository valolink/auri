function addRepeaterRow(fieldId) {
    const container = document.getElementById(fieldId + '_repeater');
    const index = container.children.length;

    const row = document.createElement('div');
    row.className = 'repeater-row';
    row.style.marginBottom = '10px';

    row.innerHTML = `
        <input type="text" placeholder="Name" name="auriapp_settings_option_name[${fieldId}][${index}][label]" class="regular-text" style="margin-right:10px;">
        <input type="text" placeholder="Value" name="auriapp_settings_option_name[${fieldId}][${index}][value]" class="regular-text">
        <button type="button" class="button remove-row">Remove</button>
    `;
    container.appendChild(row);
}

jQuery(document).on('click', '.remove-row', function () {
    jQuery(this).closest('.repeater-row').remove();
});