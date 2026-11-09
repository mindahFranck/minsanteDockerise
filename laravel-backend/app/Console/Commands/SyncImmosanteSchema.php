<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute (de façon idempotente et NON destructive) les colonnes issues du
 * document « Recommandation ImmoSanté ». Exécutée au démarrage du conteneur,
 * elle remplace l'exécution du fichier SQL en production.
 *
 * - N'utilise que Schema::hasColumn / Schema::table (compatible MySQL ET MariaDB).
 * - N'ajoute que les colonnes absentes : rejouable à chaque boot sans risque.
 * - Ne supprime, ne recrée et ne vide jamais aucune table : aucune perte de données.
 */
class SyncImmosanteSchema extends Command
{
    protected $signature = 'immosante:sync-schema';
    protected $description = "Ajoute les colonnes de la recommandation ImmoSanté (idempotent, sans perte de données)";

    public function handle(): int
    {
        $this->ensure('tmpfosa', [
            'site' => fn (Blueprint $t) => $t->boolean('site')->default(true)
                ->comment('La FOSA fonctionne-t-elle sur son site de création ?'),
        ]);

        $this->ensure('equipements', $this->equipColumns());

        $this->ensure('equipebios', $this->equipColumns() + [
            'categorie_fosa' => fn (Blueprint $t) => $t->string('categorie_fosa', 50)->nullable()
                ->comment('HR|HD|CMA|CSI pour la liste standard'),
        ]);

        $this->ensure('materielroulants', [
            'image' => fn (Blueprint $t) => $t->string('image', 500)->nullable(),
            'nombre_places' => fn (Blueprint $t) => $t->integer('nombre_places')->nullable(),
            'source_acquisition' => fn (Blueprint $t) => $t->string('source_acquisition', 20)->nullable()
                ->comment('BIP|PTF|ACHAT|DON'),
            'puissance_fiscale' => fn (Blueprint $t) => $t->integer('puissance_fiscale')->nullable()
                ->comment('Chevaux fiscaux'),
        ]);

        // Reprise : source_acquisition reprend financement si vide (matériel roulant).
        try {
            if (Schema::hasColumn('materielroulants', 'source_acquisition') && Schema::hasColumn('materielroulants', 'financement')) {
                \Illuminate\Support\Facades\DB::statement(
                    "UPDATE materielroulants SET source_acquisition = financement
                     WHERE (source_acquisition IS NULL OR source_acquisition = '')
                       AND financement IS NOT NULL AND financement <> ''"
                );
            }
        } catch (\Throwable $e) {
            $this->warn('Reprise financement->source_acquisition ignorée : ' . $e->getMessage());
        }

        $this->info('Schéma ImmoSanté synchronisé.');
        return self::SUCCESS;
    }

    /** Colonnes communes aux équipements et équipements biomédicaux. */
    private function equipColumns(): array
    {
        return [
            'marque' => fn (Blueprint $t) => $t->string('marque', 100)->nullable(),
            'modele' => fn (Blueprint $t) => $t->string('modele', 100)->nullable(),
            'numero_serie' => fn (Blueprint $t) => $t->string('numero_serie', 100)->nullable(),
            'annee_fabrication' => fn (Blueprint $t) => $t->integer('annee_fabrication')->nullable(),
            'source_acquisition' => fn (Blueprint $t) => $t->string('source_acquisition', 20)->nullable()
                ->comment('BIP|PTF|DON|ACHAT'),
            'etat' => fn (Blueprint $t) => $t->string('etat', 50)->nullable(),
            'contrat_maintenance' => fn (Blueprint $t) => $t->boolean('contrat_maintenance')->default(false),
            'type_maintenance' => fn (Blueprint $t) => $t->string('type_maintenance', 50)->nullable()
                ->comment('Préventive|Curative'),
            'date_derniere_maintenance' => fn (Blueprint $t) => $t->date('date_derniere_maintenance')->nullable(),
            'date_prochaine_maintenance' => fn (Blueprint $t) => $t->date('date_prochaine_maintenance')->nullable(),
            'duree_garantie' => fn (Blueprint $t) => $t->string('duree_garantie', 50)->nullable(),
            'date_fin_garantie' => fn (Blueprint $t) => $t->date('date_fin_garantie')->nullable(),
        ];
    }

    /** Ajoute les colonnes absentes de $defs (['colonne' => fn(Blueprint)]). */
    private function ensure(string $table, array $defs): void
    {
        if (!Schema::hasTable($table)) {
            $this->warn("Table {$table} absente, ignorée.");
            return;
        }
        $missing = array_filter($defs, fn ($def, $col) => !Schema::hasColumn($table, $col), ARRAY_FILTER_USE_BOTH);
        if (empty($missing)) {
            return;
        }
        Schema::table($table, function (Blueprint $t) use ($missing) {
            foreach ($missing as $def) {
                $def($t);
            }
        });
        $this->line("  {$table} : +" . implode(', ', array_keys($missing)));
    }
}
