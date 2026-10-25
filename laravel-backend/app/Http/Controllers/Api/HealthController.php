<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

/**
 * @OA\Tag(name="Sante du systeme", description="Health checks")
 */
class HealthController extends Controller
{
    /**
     * @OA\Get(
     *     path="/health",
     *     operationId="healthCheck",
     *     tags={"Sante du systeme"},
     *     summary="Health check complet",
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function check(): JsonResponse
    {
        $dbOk = false;
        $redisOk = false;
        try { DB::connection()->getPdo(); $dbOk = true; } catch (\Exception $e) {}
        try { Redis::ping(); $redisOk = true; } catch (\Exception $e) {}

        return $this->successResponse([
            'status' => $dbOk ? 'healthy' : 'degraded',
            'database' => $dbOk ? 'connected' : 'disconnected',
            'redis' => $redisOk ? 'connected' : 'disconnected',
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * @OA\Get(
     *     path="/health/ready",
     *     operationId="healthReady",
     *     tags={"Sante du systeme"},
     *     summary="Readiness check",
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function ready(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            return $this->successResponse(['status' => 'ready']);
        } catch (\Exception $e) {
            return $this->errorResponse('Service not ready', 503);
        }
    }

    /**
     * @OA\Get(
     *     path="/health/live",
     *     operationId="healthLive",
     *     tags={"Sante du systeme"},
     *     summary="Liveness check",
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function live(): JsonResponse
    {
        return $this->successResponse(['status' => 'alive']);
    }
}
