<?php
// Diagnostic page - DELETE AFTER USE
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>PHP Info</h2>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Server: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'unknown') . "<br>";
echo "Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'unknown') . "<br>";
echo "Script: " . ($_SERVER['SCRIPT_FILENAME'] ?? 'unknown') . "<br>";

echo "<h2>Extensions</h2>";
$required = ['pdo_mysql', 'mbstring', 'openssl', 'tokenizer', 'xml', 'ctype', 'json', 'gd', 'zip', 'fileinfo'];
foreach ($required as $ext) {
    $status = extension_loaded($ext) ? '✅' : '❌ MISSING';
    echo "$ext: $status<br>";
}

echo "<h2>Paths</h2>";
$base = dirname(__DIR__);
echo "Base path: $base<br>";
echo ".env exists: " . (file_exists($base . '/.env') ? '✅' : '❌') . "<br>";
echo "vendor/autoload.php exists: " . (file_exists($base . '/vendor/autoload.php') ? '✅' : '❌') . "<br>";
echo "bootstrap/app.php exists: " . (file_exists($base . '/bootstrap/app.php') ? '✅' : '❌') . "<br>";
echo "storage/ writable: " . (is_writable($base . '/storage') ? '✅' : '❌ NOT WRITABLE') . "<br>";
echo "storage/logs/ writable: " . (is_writable($base . '/storage/logs') ? '✅' : '❌ NOT WRITABLE') . "<br>";
echo "bootstrap/cache/ writable: " . (is_writable($base . '/bootstrap/cache') ? '✅' : '❌ NOT WRITABLE') . "<br>";

echo "<h2>Try Laravel Bootstrap</h2>";
try {
    require $base . '/vendor/autoload.php';
    echo "Autoload: ✅<br>";

    $app = require $base . '/bootstrap/app.php';
    echo "App bootstrap: ✅<br>";

    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
    echo "Kernel: ✅<br>";
} catch (\Throwable $e) {
    echo "<pre style='color:red;'>ERROR: " . $e->getMessage() . "\n\nFile: " . $e->getFile() . ":" . $e->getLine() . "\n\n" . $e->getTraceAsString() . "</pre>";
}
