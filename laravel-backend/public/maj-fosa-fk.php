<?php
/**
 * Repointe toutes les clés étrangères qui référencent `fosas` vers `tmpfosa`.
 *
 * CONTEXTE : l'application lit/écrit les FOSA dans la table `tmpfosa`, mais
 * plusieurs tables enfants (batiments, services, materielroulants, ...) ont
 * des contraintes FK pointant vers `fosas`, ce qui bloque les insertions
 * (SQLSTATE 23000 - foreign key constraint fails).
 *
 * UTILISATION :
 *   1. Uploader dans le dossier "public/" de Laravel (à côté de index.php).
 *   2. Ouvrir : https://TON-DOMAINE/maj-fosa-fk.php?key=CHANGE-MOI-2026
 *   3. Vérifier le rapport (chaque FK doit passer à [OK]).
 *   4. SUPPRIMER ce fichier du serveur ensuite.
 *
 * Idempotent : relançable sans risque (il ne touche que les FK visant `fosas`).
 * Ne supprime AUCUNE donnée.
 */

$SECRET_KEY = 'CHANGE-MOI-2026'; // change cette clé avant d'uploader

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

echo "=== Repointage des FK fosas -> tmpfosa ===\n\n";

try {
    $db = DB::getDatabaseName();

    // Vérifier que tmpfosa existe
    $hasTmp = DB::select(
        "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tmpfosa' LIMIT 1",
        [$db]
    );
    if (empty($hasTmp)) {
        exit("[ERREUR] La table `tmpfosa` n'existe pas dans la base {$db}.\n");
    }

    // Lister toutes les FK qui pointent vers `fosas`
    $fks = DB::select(
        "SELECT k.TABLE_NAME, k.COLUMN_NAME, k.CONSTRAINT_NAME, r.DELETE_RULE, r.UPDATE_RULE
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
         JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
           ON r.CONSTRAINT_NAME = k.CONSTRAINT_NAME AND r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
         WHERE k.TABLE_SCHEMA = ? AND k.REFERENCED_TABLE_NAME = 'fosas'",
        [$db]
    );

    if (empty($fks)) {
        echo "Aucune FK ne référence `fosas`. Rien à faire (déjà corrigé ?).\n";
        exit(0);
    }

    echo count($fks) . " contrainte(s) trouvée(s).\n\n";

    foreach ($fks as $fk) {
        $table = $fk->TABLE_NAME;
        $col = $fk->COLUMN_NAME;
        $name = $fk->CONSTRAINT_NAME;
        $onDelete = $fk->DELETE_RULE === 'NO ACTION' ? 'RESTRICT' : $fk->DELETE_RULE;
        $onUpdate = $fk->UPDATE_RULE === 'NO ACTION' ? 'RESTRICT' : $fk->UPDATE_RULE;

        echo "• {$table}.{$col} ({$name}) ... ";

        try {
            // 1) Supprimer l'ancienne FK vers fosas
            DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$name}`");

            // 2) Recréer la FK vers tmpfosa (mêmes règles ON DELETE/UPDATE)
            $newName = "{$table}_{$col}_tmpfosa_fk";
            try {
                DB::statement(
                    "ALTER TABLE `{$table}` ADD CONSTRAINT `{$newName}`
                     FOREIGN KEY (`{$col}`) REFERENCES `tmpfosa`(`id`)
                     ON DELETE {$onDelete} ON UPDATE {$onUpdate}"
                );
                echo "[OK] repointée vers tmpfosa\n";
            } catch (\Throwable $e2) {
                // Recréation impossible (lignes orphelines ?). L'ancienne FK est
                // déjà supprimée => les insertions fonctionnent quand même.
                echo "[OK sans FK] ancienne FK retirée, nouvelle FK non recréée : " . $e2->getMessage() . "\n";
            }
        } catch (\Throwable $e) {
            echo "[ERREUR] " . $e->getMessage() . "\n";
        }
    }

    echo "\n=== Terminé ===\n";
    echo "Teste maintenant la création d'un bâtiment/service.\n";
    echo "N'OUBLIE PAS DE SUPPRIMER maj-fosa-fk.php DU SERVEUR.\n";
} catch (\Throwable $e) {
    echo "\n[ERREUR GLOBALE] " . $e->getMessage() . "\n";
    exit(1);
}
