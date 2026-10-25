<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = Role::where('code', 'super_admin')->first();
        $admin = Role::where('code', 'admin')->first();
        $manager = Role::where('code', 'manager')->first();
        $user = Role::where('code', 'user')->first();

        $allPermissions = Permission::all();

        // Super Admin: ALL permissions
        foreach ($allPermissions as $permission) {
            RolePermission::firstOrCreate([
                'role_id' => $superAdmin->id,
                'permission_id' => $permission->id,
            ]);
        }

        // Admin: All except users.create, users.delete, users.manage
        $adminExcluded = ['users.create', 'users.delete', 'users.manage'];
        foreach ($allPermissions as $permission) {
            if (!in_array($permission->name, $adminExcluded)) {
                RolePermission::firstOrCreate([
                    'role_id' => $admin->id,
                    'permission_id' => $permission->id,
                ]);
            }
        }

        // Manager: read on geographic + CRUD on facility resources + statistics.read
        $managerReadOnly = ['regions', 'departements', 'arrondissements', 'communes', 'districts', 'airesantes', 'cameroun'];
        $managerCrud = ['fosas', 'batiments', 'services', 'personnels', 'equipements', 'equipebios', 'materielroulants', 'categories', 'degradations', 'parametres'];

        foreach ($allPermissions as $permission) {
            $allowed = false;

            if (in_array($permission->resource, $managerReadOnly) && $permission->action === 'read') {
                $allowed = true;
            }
            if (in_array($permission->resource, $managerCrud) && in_array($permission->action, ['create', 'read', 'update', 'delete'])) {
                $allowed = true;
            }
            if ($permission->name === 'statistics.read' || $permission->name === 'import.create') {
                $allowed = true;
            }

            if ($allowed) {
                RolePermission::firstOrCreate([
                    'role_id' => $manager->id,
                    'permission_id' => $permission->id,
                ]);
            }
        }

        // User: read only on everything except users and audit
        $userExcluded = ['users', 'audit'];
        foreach ($allPermissions as $permission) {
            if ($permission->action === 'read' && !in_array($permission->resource, $userExcluded)) {
                RolePermission::firstOrCreate([
                    'role_id' => $user->id,
                    'permission_id' => $permission->id,
                ]);
            }
        }
    }
}
