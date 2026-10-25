<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('DEFAULT_ADMIN_PASSWORD', 'Admin@2024');

        $users = [
            [
                'email' => 'superadmin@minsante.cm',
                'password' => $password,
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'role' => 'super_admin',
                'scope_type' => 'national',
            ],
            [
                'email' => 'admin@minsante.cm',
                'password' => $password,
                'first_name' => 'Admin',
                'last_name' => 'User',
                'role' => 'admin',
                'scope_type' => 'national',
            ],
            [
                'email' => 'manager@minsante.cm',
                'password' => $password,
                'first_name' => 'Manager',
                'last_name' => 'User',
                'role' => 'manager',
                'scope_type' => 'regional',
            ],
            [
                'email' => 'user@minsante.cm',
                'password' => $password,
                'first_name' => 'User',
                'last_name' => 'Standard',
                'role' => 'user',
                'scope_type' => 'national',
            ],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
