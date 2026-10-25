<?php
/**
 * Deploy script - SUPPRIMER APRES UTILISATION
 */
set_time_limit(600);
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<pre>";
$base = dirname(__DIR__);
chdir($base);

$phpBin = '/opt/alt/php82/usr/bin/php';
$composerHome = $base . '/.composer';
@mkdir($composerHome, 0775, true);
$env = 'HOME=' . escapeshellarg($base) . ' COMPOSER_HOME=' . escapeshellarg($composerHome);

echo "=== DEPLOY SCRIPT ===\n";
echo "Base: $base\n\n";

// Step 1: Ensure composer.phar exists
if (!file_exists($base . '/composer.phar')) {
    echo "Downloading composer.phar...\n";
    $phar = file_get_contents('https://getcomposer.org/download/latest-stable/composer.phar');
    if ($phar === false) {
        die("❌ Could not download composer.phar\n");
    }
    file_put_contents($base . '/composer.phar', $phar);
    echo "Downloaded ✅ (" . round(strlen($phar) / 1024 / 1024, 1) . " MB)\n\n";
} else {
    echo "composer.phar exists ✅\n\n";
}

// Step 2: Check if vendor exists, install if needed
if (!file_exists($base . '/vendor/autoload.php')) {
    echo "=== COMPOSER INSTALL ===\n\n";
    $cmd = $env . ' ' . $phpBin . ' composer.phar install --no-dev --optimize-autoloader --no-interaction 2>&1';
    $out = [];
    exec($cmd, $out, $code);
    echo implode("\n", $out) . "\n";
    echo "Exit: $code\n\n";
} else {
    // Just dump autoload to pick up new files
    echo "=== COMPOSER DUMP-AUTOLOAD ===\n\n";
    $cmd = $env . ' ' . $phpBin . ' composer.phar dump-autoload --optimize 2>&1';
    $out = [];
    exec($cmd, $out, $code);
    echo implode("\n", $out) . "\n";
    echo "Exit: $code\n\n";
}

// Step 3: Artisan commands
echo "=== ARTISAN CACHE ===\n\n";

$commands = [
    'config:clear',
    'route:clear',
    'cache:clear',
    'config:cache',
    'route:cache',
];

foreach ($commands as $c) {
    $out = [];
    exec($env . ' ' . $phpBin . ' artisan ' . $c . ' 2>&1', $out, $rc);
    echo "php artisan $c -> " . ($rc === 0 ? '✅' : '❌') . " " . implode(' ', $out) . "\n";
}

// Storage link
$out = [];
exec($env . ' ' . $phpBin . ' artisan storage:link 2>&1', $out, $rc);
echo "storage:link -> " . implode(' ', $out) . "\n";

echo "\n=== DONE ===\n";
echo "Test: https://api-minsante.it-grafik.com/api/health/live\n";
echo "</pre>";
