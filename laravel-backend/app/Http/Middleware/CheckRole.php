<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Exceptions\ForbiddenException;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            throw new ForbiddenException('Vous n\'avez pas les permissions nécessaires.');
        }

        return $next($request);
    }
}
