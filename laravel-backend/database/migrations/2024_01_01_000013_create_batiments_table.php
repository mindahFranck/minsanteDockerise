<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batiments', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('type')->nullable();
            $table->string('etat')->nullable()->comment('bon, moyen, mauvais, critique');
            $table->foreignId('fosa_id')->constrained('fosas')->onDelete('cascade');
            $table->foreignId('degradation_id')->nullable()->constrained('degradations')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batiments');
    }
};
