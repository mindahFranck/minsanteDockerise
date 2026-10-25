<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class GeographicScope
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        $filters = [];

        switch ($user->scope_type) {
            case 'regional':
                if ($user->region_id) $filters['region_id'] = $user->region_id;
                break;
            case 'departemental':
                if ($user->departement_id) $filters['departement_id'] = $user->departement_id;
                break;
            case 'arrondissement':
                if ($user->arrondissement_id) $filters['arrondissement_id'] = $user->arrondissement_id;
                break;
        }

        $request->attributes->set('geographic_filters', $filters);

        return $next($request);
    }
}
