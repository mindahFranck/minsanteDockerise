<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(name="Audit", description="Journaux d'audit")
 */
class AuditController extends Controller
{
    public function __construct(protected AuditService $auditService) {}

    /**
     * @OA\Get(
     *     path="/audit/user/{userId}",
     *     operationId="getAuditUserHistory",
     *     tags={"Audit"},
     *     summary="Historique d'un utilisateur",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="userId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function userHistory(Request $request, int $userId): JsonResponse
    {
        $data = $this->auditService->getUserHistory($userId, $request->only(['resource', 'action']), $request->input('per_page', 15));
        return $this->paginatedResponse($data);
    }

    /**
     * @OA\Get(
     *     path="/audit/resource/{resource}/{resourceId}",
     *     operationId="getAuditResourceHistory",
     *     tags={"Audit"},
     *     summary="Historique d'une ressource",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="resource", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Parameter(name="resourceId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function resourceHistory(string $resource, int $resourceId): JsonResponse
    {
        $data = $this->auditService->getResourceHistory($resource, $resourceId);
        return $this->paginatedResponse($data);
    }

    /**
     * @OA\Get(
     *     path="/audit/activity",
     *     operationId="getAuditActivity",
     *     tags={"Audit"},
     *     summary="Activite recente",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function activity(Request $request): JsonResponse
    {
        $data = $this->auditService->getRecentActivity(
            $request->only(['resource', 'action', 'user_id', 'date_from', 'date_to']),
            $request->input('per_page', 15)
        );
        return $this->paginatedResponse($data);
    }

    /** @OA\Get(path="/audit/stats", tags={"Audit"}, summary="Statistiques d'audit", security={{"bearerAuth":{}}}, @OA\Response(response=200, description="OK")) */
    public function stats(): JsonResponse
    {
        return $this->successResponse(['message' => 'Statistics feature coming soon']);
    }
}
