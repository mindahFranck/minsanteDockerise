<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StatisticsService;
use Illuminate\Http\JsonResponse;

/**
 * @OA\Tag(name="Statistiques", description="Statistiques du systeme")
 */
class StatisticsController extends Controller
{
    public function __construct(protected StatisticsService $statisticsService) {}

    /**
     * @OA\Get(
     *     path="/statistics/overview",
     *     operationId="getStatisticsOverview",
     *     tags={"Statistiques"},
     *     summary="Vue d'ensemble",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function overview(): JsonResponse
    {
        return $this->successResponse($this->statisticsService->getOverview());
    }

    /**
     * @OA\Get(
     *     path="/statistics/fosas",
     *     operationId="getStatisticsFosas",
     *     tags={"Statistiques"},
     *     summary="Statistiques FOSA",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function fosas(): JsonResponse
    {
        return $this->successResponse($this->statisticsService->getFosaStatistics());
    }

    /**
     * @OA\Get(
     *     path="/statistics/personnel",
     *     operationId="getStatisticsPersonnel",
     *     tags={"Statistiques"},
     *     summary="Statistiques personnel",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function personnel(): JsonResponse
    {
        return $this->successResponse($this->statisticsService->getPersonnelStatistics());
    }

    /**
     * @OA\Get(
     *     path="/statistics/equipment",
     *     operationId="getStatisticsEquipment",
     *     tags={"Statistiques"},
     *     summary="Statistiques equipements",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function equipment(): JsonResponse
    {
        return $this->successResponse($this->statisticsService->getEquipmentStatistics());
    }

    /** @OA\Get(path="/statistics/geographic", tags={"Statistiques"}, summary="Distribution géographique", security={{"bearerAuth":{}}}, @OA\Response(response=200, description="OK")) */
    public function geographic(): JsonResponse
    {
        return $this->successResponse($this->statisticsService->getGeographicDistribution());
    }

    /** @OA\Get(path="/statistics/buildings", tags={"Statistiques"}, summary="Statistiques bâtiments", security={{"bearerAuth":{}}}, @OA\Response(response=200, description="OK")) */
    public function buildings(): JsonResponse
    {
        return $this->successResponse($this->statisticsService->getBuildingStatistics());
    }

    /** @OA\Get(path="/statistics/patients", tags={"Statistiques"}, summary="Statistiques patients", security={{"bearerAuth":{}}}, @OA\Response(response=200, description="OK")) */
    public function patients(): JsonResponse
    {
        return $this->successResponse($this->statisticsService->getPatientStatistics());
    }

    /** @OA\Get(path="/statistics/comparative", tags={"Statistiques"}, summary="Statistiques comparatives", security={{"bearerAuth":{}}}, @OA\Response(response=200, description="OK")) */
    public function comparative(): JsonResponse
    {
        return $this->successResponse($this->statisticsService->getComparativeStatistics());
    }

    /** @OA\Get(path="/statistics/dashboard", tags={"Statistiques"}, summary="Indicateurs du tableau de bord", security={{"bearerAuth":{}}}, @OA\Response(response=200, description="OK")) */
    public function dashboard(): JsonResponse
    {
        return $this->successResponse($this->statisticsService->getDashboard());
    }
}
