<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fosas', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('type');
            $table->string('categorie')->nullable();
            $table->integer('capacite_lits')->default(0);
            $table->boolean('est_ferme')->default(false);
            $table->foreignId('arrondissement_id')->nullable()->constrained('arrondissements')->onDelete('set null');
            $table->foreignId('airesante_id')->nullable()->constrained('airesantes')->onDelete('set null');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('image')->nullable();
            $table->text('adresse')->nullable();
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->string('site_web')->nullable();
            $table->date('date_creation')->nullable();
            $table->string('responsable')->nullable();
            $table->date('date_prochaine_maintenance')->nullable();
            $table->date('derniere_maintenance')->nullable();
            $table->text('notes_maintenance')->nullable();
            $table->string('contact_urgence')->nullable();
            $table->string('horaires_ouverture')->nullable();
            $table->timestamps();
        });

        DB::statement('ALTER TABLE fosas ADD geom POINT NULL SRID 4326');
    }

    public function down(): void
    {
        Schema::dropIfExists('fosas');
    }
};
