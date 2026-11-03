<?php
/**
 * Fallback pour servir les fichiers storage si le symlink ne fonctionne pas
 * URL: /storage.php?file=fosas/image.jpg
 * Ou via .htaccess: /storage/fosas/image.jpg -> storage.php?file=fosas/image.jpg
 */

$file = $_GET['file'] ?? '';
if (empty($file)) {
    // Extraire le chemin depuis REQUEST_URI (/storage/fosas/xxx.jpg)
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (preg_match('#/storage/(.+)$#', $uri, $matches)) {
        $file = $matches[1];
    }
}

if (empty($file)) {
    http_response_code(404);
    echo 'File not found';
    exit;
}

// Sécurité : empêcher le path traversal
$file = str_replace(['..', '\\'], ['', '/'], $file);
$path = dirname(__DIR__) . '/storage/app/public/' . $file;

$real = realpath($path);
$root = realpath(dirname(__DIR__) . '/storage/app/public');
if ($real === false || $root === false || strpos($real, $root . DIRECTORY_SEPARATOR) !== 0) {
    $path = '';
}

if ($path === '' || !is_file($path)) {
    error_log('[fosa-image] fichier introuvable : ' . $file . ' (cherche ' . $path . ') referer=' . ($_SERVER['HTTP_REFERER'] ?? '-') . ' ip=' . ($_SERVER['REMOTE_ADDR'] ?? '-'));
    http_response_code(404);
    echo 'File not found';
    exit;
}

// Déterminer le type MIME
$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$mimes = [
    'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
    'gif' => 'image/gif', 'webp' => 'image/webp', 'svg' => 'image/svg+xml',
    'pdf' => 'application/pdf', 'csv' => 'text/csv',
];

header('Access-Control-Allow-Origin: *');
header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
header('Content-Length: ' . filesize($path));
header('Cache-Control: public, max-age=31536000');
readfile($path);
