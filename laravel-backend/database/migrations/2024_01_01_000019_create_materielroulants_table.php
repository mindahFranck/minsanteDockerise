<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materielroulants', function (Blueprint $table) {
            $table->id();
            $table->string('numero_chassis')->nullable();
            $table->string('marque')->nullable();
            $table->string('modele')->nullable();
            $table->string('type')->nullable();
            $table->string('etat')->nullable();
            $table->integer('quantite')->default(1);
            $table->string('immatriculation')->nullable();
            $table->integer('annee_fabrication')->nullable();
            $table->date('date_acquisition')->nullable();
            $table->integer('kilometrage')->nullable();
            $table->string('carburant')->nullable();
            $table->string('puissance')->nullable();
            $table->string('couleur')->nullable();
            $table->string('assurance_numero')->nullable();
            $table->date('assurance_expiration')->nullable();
            $table->date('derniere_visite_technique')->nullable();
            $table->date('prochaine_visite_technique')->nullable();
            $table->foreignId('fosa_id')->nullable()->constrained('fosas')->onDelete('set null');
            $table->foreignId('service_id')->nullable()->constrained('services')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materielroulants');
    }
};
