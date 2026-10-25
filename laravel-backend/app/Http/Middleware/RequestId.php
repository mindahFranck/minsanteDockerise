<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-Id', Str::uuid()->toString());
        $request->attributes->set('request_id', $requestId);

        /** @var Response $response */
        $response = $next($request);

        if ($response) {
            $response->headers->set('X-Request-Id', $requestId);
        }

        return $response;
    }
}
