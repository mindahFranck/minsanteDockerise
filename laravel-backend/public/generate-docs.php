<?php
/**
 * Generate Swagger docs - SUPPRIMER APRES UTILISATION
 */
set_time_limit(120);
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<pre>";
$base = dirname(__DIR__);
chdir($base);

$phpBin = '/opt/alt/php82/usr/bin/php';
$env = 'HOME=' . escapeshellarg($base) . ' COMPOSER_HOME=' . escapeshellarg($base . '/.composer');

// Create storage/api-docs directory
@mkdir($base . '/storage/api-docs', 0775, true);

// Generate swagger docs
echo "Generating Swagger/OpenAPI documentation...\n\n";
$cmd = $env . ' ' . $phpBin . ' artisan l5-swagger:generate 2>&1';
$output = [];
exec($cmd, $output, $code);
echo implode("\n", $output) . "\n";
echo "Exit: $code\n\n";

if ($code === 0) {
    echo "✅ Documentation generated!\n";
    echo "Open: https://api-minsante.it-grafik.com/api/documentation\n";
} else {
    echo "❌ Failed. Trying to check if api-docs.json exists...\n";
    $paths = [
        $base . '/storage/api-docs/api-docs.json',
        $base . '/public/api-docs.json',
    ];
    foreach ($paths as $p) {
        echo "$p: " . (file_exists($p) ? '✅ EXISTS (' . filesize($p) . ' bytes)' : '❌ NOT FOUND') . "\n";
    }
}

echo "\n⚠️ Delete this file after use!\n";
echo "</pre>";
