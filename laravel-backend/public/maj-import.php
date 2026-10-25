<?php
/**
 * Script de mise à jour / nettoyage des caches après upload des fichiers d'import.
 *
 * UTILISATION :
 *   1. Uploader ce fichier dans le dossier "public/" de Laravel (à côté de index.php).
 *   2. Ouvrir dans le navigateur :  https://TON-DOMAINE/maj-import.php?key=CHANGE-MOI-2026
 *   3. Vérifier que chaque étape affiche "OK".
 *   4. SUPPRIMER ce fichier du serveur immédiatement après (sécurité).
 *
 * Ce script :
 *   - vide les caches Laravel (config, routes, vues, application, compiled)
 *   - réinitialise l'OPcache PHP (pour que les .php modifiés soient relus)
 *   - n'exécute AUCUNE migration et ne touche PAS à la base de données.
 */

// ─── Sécurité : change cette clé avant d'uploader ───────────────────────────
$SECRET_KEY = 'CHANGE-MOI-2026';

header('Content-Type: text/plain; charset=utf-8');

if (($_GET['key'] ?? null) !== $SECRET_KEY) {
    http_response_code(403);
    exit("403 - Clé invalide. Ajoute ?key=... à l'URL (et modifie \$SECRET_KEY dans le fichier).\n");
}

echo "=== Mise à jour des caches - API Health ===\n\n";

// 1) Reset OPcache (le plus important sur hébergement mutualisé)
if (function_exists('opcache_reset')) {
    echo opcache_reset() ? "[OK] OPcache réinitialisé\n" : "[--] OPcache présent mais non réinitialisé (peut nécessiter un reload PHP)\n";
} else {
    echo "[--] OPcache non disponible (rien à faire)\n";
}

// 2) Reset du cache realpath
clearstatcache(true);
echo "[OK] realpath cache vidé\n";

// 3) Caches Laravel via Artisan
$bootstrap = __DIR__ . '/../bootstrap/app.php';

if (!file_exists($bootstrap)) {
    echo "\n[ERREUR] Impossible de trouver bootstrap/app.php depuis " . __DIR__ . "\n";
    echo "Place ce fichier dans le dossier public/ de Laravel, puis relance.\n";
    exit(1);
}

try {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require $bootstrap;

    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

    $commands = [
        'config:clear',
        'route:clear',
        'view:clear',
        'cache:clear',
        'clear-compiled',
    ];

    echo "\n--- Commandes Artisan ---\n";
    foreach ($commands as $cmd) {
        try {
            $kernel->call($cmd);
            echo "[OK] php artisan {$cmd}\n";
        } catch (\Throwable $e) {
            echo "[!!] {$cmd} : " . $e->getMessage() . "\n";
        }
    }

    echo "\n=== Terminé avec succès ===\n";
    echo "N'OUBLIE PAS DE SUPPRIMER maj-import.php DU SERVEUR.\n";
} catch (\Throwable $e) {
    echo "\n[ERREUR] " . $e->getMessage() . "\n";
    exit(1);
}
