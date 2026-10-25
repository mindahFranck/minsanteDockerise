<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $resources = [
            'users', 'roles', 'regions', 'departements', 'arrondissements', 'communes',
            'districts', 'airesantes', 'fosas', 'batiments', 'services', 'personnels',
            'equipements', 'equipebios', 'materielroulants', 'categories', 'degradations',
            'parametres', 'audit', 'statistics', 'import',
        ];

        $actions = ['create', 'read', 'update', 'delete', 'manage', 'export'];

        foreach ($resources as $resource) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(
                    ['name' => "{$resource}.{$action}"],
                    [
                        'resource' => $resource,
                        'action' => $action,
                        'description' => ucfirst($action) . " {$resource}",
                    ]
                );
            }
        }
    }
}
