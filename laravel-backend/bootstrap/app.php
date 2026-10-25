<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Derrière nginx-proxy (Docker) : vraie IP client pour le throttle, schéma https
        $middleware->trustProxies(at: '*');
        $middleware->api(prepend: [
            \App\Http\Middleware\RequestId::class,
        ]);
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'geographic.scope' => \App\Http\Middleware\GeographicScope::class,
        ]);
        $middleware->throttleApi('60,1');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Force all API responses to JSON
        $exceptions->shouldRenderJsonWhen(function (Request $request, \Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // Custom API exceptions
        $exceptions->renderable(function (\App\Exceptions\ApiException $e) {
            return $e->render();
        });

        // Authentication exception -> 401 JSON
        $exceptions->renderable(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié. Token JWT invalide ou expiré.',
            ], 401);
        });

        // Too many requests -> 429 JSON
        $exceptions->renderable(function (\Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Trop de requêtes. Veuillez réessayer plus tard.',
            ], 429);
        });
    })->create();
