<?php
/**
 * Ajoute (si absentes) les colonnes attendues par les formulaires mais manquantes
 * dans les tables legacy : description, nom (equipebios), capacite, superficie, année.
 *
 * UTILISATION :
 *   1. Uploader dans "public/" (à côté de index.php).
 *   2. Ouvrir : https://TON-DOMAINE/maj-colonnes.php?key=CHANGE-MOI-2026
 *   3. Vérifier le rapport.
 *   4. SUPPRIMER ce fichier ensuite.
 *
 * Non destructif : n'AJOUTE que des colonnes nullable, ne supprime/modifie rien.
 * Idempotent : relançable (ignore les colonnes déjà présentes).
 */

$SECRET_KEY = 'CHANGE-MOI-2026'; // change avant upload

header('Content-Type: text/plain; charset=utf-8');

if (($_GET['key'] ?? null) !== $SECRET_KEY) {
    http_response_code(403);
    exit("403 - Clé invalide.\n");
}

$bootstrap = __DIR__ . '/../bootstrap/app.php';
if (!file_exists($bootstrap)) {
    exit("[ERREUR] bootstrap/app.php introuvable. Place ce fichier dans public/.\n");
}
require __DIR__ . '/../vendor/autoload.php';
$app = require $bootstrap;
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$plan = [
    'batiments'   => [
        'superficie'        => 'DECIMAL(12,2) NULL',
        'anne_construction' => 'INT NULL',
        'description'       => 'TEXT NULL',
    ],
    'services'    => [
        'capacite'    => 'INT NULL',
        'description' => 'TEXT NULL',
    ],
    'equipebios'  => [
        'nom'         => 'VARCHAR(200) NULL',
        'description' => 'TEXT NULL',
    ],
    'equipements' => [
        'description' => 'TEXT NULL',
    ],
];

echo "=== Ajout des colonnes manquantes ===\n\n";

try {
    $db = DB::getDatabaseName();

    foreach ($plan as $table => $columns) {
        // La table existe-t-elle ?
        $tableExists = DB::select(
            "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1",
            [$db, $table]
        );
        if (empty($tableExists)) {
            echo "[SKIP] table `{$table}` inexistante\n";
            continue;
        }

        foreach ($columns as $col => $definition) {
            $exists = DB::select(
                "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
                [$db, $table, $col]
            );

            if (!empty($exists)) {
                echo "[=] {$table}.{$col} déjà présente\n";
                continue;
            }

            try {
                DB::statement("ALTER TABLE `{$table}` ADD COLUMN `{$col}` {$definition}");
                echo "[OK] {$table}.{$col} ajoutée ({$definition})\n";
            } catch (\Throwable $e) {
                echo "[ERREUR] {$table}.{$col} : " . $e->getMessage() . "\n";
            }
        }
    }

    echo "\n=== Terminé ===\n";
    echo "N'OUBLIE PAS DE SUPPRIMER maj-colonnes.php DU SERVEUR.\n";
} catch (\Throwable $e) {
    echo "\n[ERREUR GLOBALE] " . $e->getMessage() . "\n";
    exit(1);
}
