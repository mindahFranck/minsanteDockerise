<?php
/**
 * Post-install: cache config & routes - SUPPRIMER APRES UTILISATION
 */
set_time_limit(120);
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<pre>";
$base = dirname(__DIR__);
chdir($base);

$commands = [
    'php artisan config:clear',
    'php artisan route:clear',
    'php artisan cache:clear',
    'php artisan config:cache',
    'php artisan route:cache',
    'php artisan storage:link',
];

foreach ($commands as $cmd) {
    echo "$ $cmd\n";
    $output = [];
    exec($cmd . ' 2>&1', $output, $code);
    echo implode("\n", $output) . "\n";
    echo "Exit: $code\n\n";
}

echo "✅ DONE! Now test: https://api-minsante.it-grafik.com/api/health/live\n\n";
echo "⚠️  IMPORTANT: Delete these files now:\n";
echo "  - public/debug.php\n";
echo "  - public/install.php\n";
echo "  - public/post-install.php\n";
echo "  - composer.phar (at root)\n";
echo "</pre>";
