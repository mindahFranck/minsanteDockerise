<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Exceptions\ForbiddenException;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $resource, string $action)
    {
        $user = $request->user();
        if (!$user) {
            throw new ForbiddenException('Non authentifié.');
        }

        if ($user->role === 'super_admin') {
            return $next($request);
        }

        $permissions = Cache::remember("role_permissions:{$user->role}", 3600, function () use ($user) {
            return DB::table('role_permissions')
                ->join('roles', 'roles.id', '=', 'role_permissions.role_id')
                ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                ->where('roles.code', $user->role)
                ->pluck('permissions.name')
                ->toArray();
        });

        $permissionName = "{$resource}.{$action}";
        if (!in_array($permissionName, $permissions)) {
            throw new ForbiddenException("Permission '{$permissionName}' requise.");
        }

        return $next($request);
    }
}
