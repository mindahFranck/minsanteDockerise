<?php

namespace Database\Seeders;

use App\Models\Categorie;
use Illuminate\Database\Seeder;

class CategorieSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['nom' => 'Médecin', 'type' => 'medical'],
            ['nom' => 'Infirmier', 'type' => 'medical'],
            ['nom' => 'Sage-femme', 'type' => 'medical'],
            ['nom' => 'Technicien de laboratoire', 'type' => 'technique'],
            ['nom' => 'Pharmacien', 'type' => 'medical'],
            ['nom' => 'Agent administratif', 'type' => 'administratif'],
            ['nom' => 'Agent d\'entretien', 'type' => 'support'],
            ['nom' => 'Technicien biomédical', 'type' => 'technique'],
        ];

        foreach ($categories as $cat) {
            Categorie::firstOrCreate(['nom' => $cat['nom']], $cat);
        }
    }
}
