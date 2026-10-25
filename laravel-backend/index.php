<?php

/**
 * Laravel - Proxy index.php pour hébergement mutualisé
 * Ce fichier redirige toutes les requêtes vers public/index.php
 */

// Rediriger vers le dossier public
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Si le fichier existe dans public/, le servir directement
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

// Sinon, charger Laravel via public/index.php
require_once __DIR__ . '/public/index.php';
