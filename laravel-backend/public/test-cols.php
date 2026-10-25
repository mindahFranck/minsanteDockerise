<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$base = dirname(__DIR__);
require $base . '/vendor/autoload.php';
$app = require $base . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "<pre>";
$tables = ['tmpfosa', 'batiments', 'services', 'personnels', 'equipements', 'equipebios', 'materielroulants', 'parametres', 'categories', 'degradations', 'users'];
foreach ($tables as $t) {
    $cols = \DB::select("SHOW COLUMNS FROM {$t}");
    $colNames = array_map(fn($c) => $c->Field, $cols);
    $hasCreatedAt = in_array('createdAt', $colNames);
    $hasCreated_at = in_array('created_at', $colNames);
    $hasUpdatedAt = in_array('updatedAt', $colNames);
    $hasUpdated_at = in_array('updated_at', $colNames);
    echo "{$t}: ";
    if ($hasCreatedAt) echo "createdAt ";
    if ($hasCreated_at) echo "created_at ";
    if ($hasUpdatedAt) echo "updatedAt ";
    if ($hasUpdated_at) echo "updated_at ";
    if (!$hasCreatedAt && !$hasCreated_at && !$hasUpdatedAt && !$hasUpdated_at) echo "NO TIMESTAMPS";
    echo "\n";
}
echo "</pre>";
