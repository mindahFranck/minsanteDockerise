<?php

namespace Database\Seeders;

use App\Models\Degradation;
use Illuminate\Database\Seeder;

class DegradationSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'Fissures', 'Infiltration d\'eau', 'Toiture endommagée',
            'Murs dégradés', 'Sol détérioré', 'Installation électrique défectueuse',
            'Plomberie défaillante', 'Menuiserie abîmée',
        ];

        foreach ($types as $type) {
            Degradation::firstOrCreate(['type' => $type]);
        }
    }
}
