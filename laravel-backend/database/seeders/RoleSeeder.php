<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Administrateur', 'code' => 'super_admin', 'description' => 'Accès complet au système', 'level' => 100],
            ['name' => 'Administrateur', 'code' => 'admin', 'description' => 'Gestion des données et utilisateurs', 'level' => 80],
            ['name' => 'Gestionnaire', 'code' => 'manager', 'description' => 'Gestion des FOSA et infrastructures', 'level' => 60],
            ['name' => 'Utilisateur', 'code' => 'user', 'description' => 'Consultation des données', 'level' => 40],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['code' => $role['code']], $role);
        }
    }
}
