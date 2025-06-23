<?php
use setasign\Fpdi\Fpdi;
use PDFMerger\PDFMerger;

require_once __DIR__ . '/PDFMerger/PDFMerger.php';

class AuriappPDFGenerator {

	public static function handle_ajax_request() {
		$pdf = new PDFMerger();

		// Example: add PDFs
		// $pdf->addPDF(AURIAPP_PLUGIN_DIR . 'assets/pdfs/section1.pdf', 'all');
		// $pdf->addPDF(AURIAPP_PLUGIN_DIR . 'assets/pdfs/section2.pdf', 'all');

		$outputPath = AURIAPP_PLUGIN_DIR . 'temp/merged_report.pdf';
		$pdf->merge('file', $outputPath);

		$url = plugin_dir_url(__FILE__) . '../temp/merged_report.pdf';
		wp_send_json_success(['url' => $url]);
	}
}
