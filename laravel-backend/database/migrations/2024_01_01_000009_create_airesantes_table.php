<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('airesantes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->foreignId('district_id')->constrained('districts')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('airesantes');
    }
};
