<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
echo "<pre>";

$base = dirname(__DIR__);
echo "Base: $base\n\n";

// Check key files
$files = [
    'app/Models/User.php',
    'app/Models/Fosa.php',
    'app/Http/Controllers/Api/AuthController.php',
    'app/Http/Controllers/Api/FosaController.php',
    'app/Http/Controllers/Api/HealthController.php',
    'app/Http/Controllers/Api/CrudController.php',
    'app/Http/Middleware/RequestId.php',
    'app/Http/Middleware/CheckRole.php',
    'app/Services/AuthService.php',
    'app/Services/AuditService.php',
    'app/Exceptions/ApiException.php',
    'app/Providers/AppServiceProvider.php',
    'bootstrap/app.php',
    'config/app.php',
    'config/auth.php',
    'routes/api.php',
    '.env',
    '.htaccess',
    'index.php',
    'vendor/autoload.php',
];

foreach ($files as $f) {
    $exists = file_exists($base . '/' . $f);
    echo ($exists ? '✅' : '❌') . " $f\n";
}

// Try bootstrap
echo "\n=== BOOTSTRAP TEST ===\n";
try {
    require $base . '/vendor/autoload.php';
    $app = require $base . '/bootstrap/app.php';
    $kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
    echo "✅ Laravel bootstrap OK\n";

    // Try a simple route
    $request = \Illuminate\Http\Request::create('/api/health/live', 'GET');
    $response = $kernel->handle($request);
    echo "\n=== RESPONSE /api/health/live ===\n";
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Body: " . $response->getContent() . "\n";
} catch (\Throwable $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "</pre>";
