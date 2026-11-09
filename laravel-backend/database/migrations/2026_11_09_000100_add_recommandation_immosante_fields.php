<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Champs issus du document « Recommandation et mise-à-jour de l'application ImmoSanté ».
 *
 * - FOSA : booléen `site` (la FOSA fonctionne-t-elle sur son site de création ?).
 * - Équipements & équipements biomédicaux : marque, modèle, n° série, année de
 *   fabrication, source d'acquisition (BIP|PTF|DON|ACHAT), état, maintenance, garantie.
 * - Équipements biomédicaux : + catégorie FOSA (pour la liste standard par catégorie).
 * - Matériel roulant : image, nombre de places, source d'acquisition, puissance fiscale.
 *
 * La vraie table FOSA est `tmpfosa`. Chaque ajout est protégé par hasColumn
 * (idempotent : ne touche pas aux colonnes/données déjà présentes).
 */
return new class extends Migration
{
    public function up(): void
    {
        // --- FOSA (tmpfosa) ---
        $this->ensure('tmpfosa', [
            'site' => fn (Blueprint $t) => $t->boolean('site')->default(true)
                ->comment('La FOSA fonctionne-t-elle sur son site de création ?'),
        ]);

        // --- Équipements (non biomédicaux) ---
        $this->ensure('equipements', $this->equipColumns());

        // --- Équipements biomédicaux (+ catégorie FOSA) ---
        $this->ensure('equipebios', $this->equipColumns() + [
            'categorie_fosa' => fn (Blueprint $t) => $t->string('categorie_fosa', 50)->nullable()
                ->comment('HR|HD|CMA|CSI pour la liste standard'),
        ]);

        // --- Matériel roulant ---
        $this->ensure('materielroulants', [
            'image' => fn (Blueprint $t) => $t->string('image', 500)->nullable(),
            'nombre_places' => fn (Blueprint $t) => $t->integer('nombre_places')->nullable(),
            'source_acquisition' => fn (Blueprint $t) => $t->string('source_acquisition', 20)->nullable()
                ->comment('BIP|PTF|ACHAT|DON'),
            'puissance_fiscale' => fn (Blueprint $t) => $t->integer('puissance_fiscale')->nullable()
                ->comment('Chevaux fiscaux'),
        ]);
    }

    public function down(): void
    {
        $this->drop('tmpfosa', ['site']);
        $this->drop('equipements', array_keys($this->equipColumns()));
        $this->drop('equipebios', array_merge(array_keys($this->equipColumns()), ['categorie_fosa']));
        $this->drop('materielroulants', ['image', 'nombre_places', 'source_acquisition', 'puissance_fiscale']);
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
    }

    private function drop(string $table, array $cols): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }
        $existing = array_values(array_filter($cols, fn ($c) => Schema::hasColumn($table, $c)));
        if (!empty($existing)) {
            Schema::table($table, fn (Blueprint $t) => $t->dropColumn($existing));
        }
    }
};
