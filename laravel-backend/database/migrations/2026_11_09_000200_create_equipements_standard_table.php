<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catalogue de référence : liste standard d'équipements par catégorie de FOSA
 * (HR / HD / CMA / CSI), issue des documents « LISTE STANDARD » du MINSANTÉ.
 * Table de données de référence, séparée des équipements réels (`equipements`,
 * `equipebios`). Peuplée par EquipementStandardSeeder / la commande immosante:sync-schema.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('equipements_standard')) {
            return;
        }
        Schema::create('equipements_standard', function (Blueprint $table) {
            $table->id();
            $table->string('categorie_fosa', 10)->index()->comment('HR|HD|CMA|CSI');
            $table->string('famille', 10)->default('bio')->index()->comment('bio|autre (biomédical ou non)');
            $table->string('service', 150)->nullable();
            $table->string('code', 50)->nullable();
            $table->string('designation', 500);
            $table->text('specifications')->nullable();
            $table->string('quantite_standard', 50)->nullable();
            $table->string('prix_unitaire', 50)->nullable();
            $table->timestamps();
            $table->index(['categorie_fosa', 'designation']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipements_standard');
    }
};
