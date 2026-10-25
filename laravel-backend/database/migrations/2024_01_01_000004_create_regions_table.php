<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('capitale')->nullable();
            $table->bigInteger('population')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
        });

        DB::statement('ALTER TABLE regions ADD geom GEOMETRY NULL SRID 4326');
    }

    public function down(): void
    {
        Schema::dropIfExists('regions');
    }
};
