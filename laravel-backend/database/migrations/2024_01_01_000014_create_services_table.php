<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('responsable')->nullable();
            $table->date('date_creation')->nullable();
            $table->foreignId('batiment_id')->nullable()->constrained('batiments')->onDelete('set null');
            $table->foreignId('fosa_id')->constrained('fosas')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
