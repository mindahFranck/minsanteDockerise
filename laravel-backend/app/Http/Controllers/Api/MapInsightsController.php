<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MapInsightsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Données de la carte publique (lecture seule, sans authentification, comme les
 * autres routes GET des FOSA).
 */
class MapInsightsController extends Controller
{
    public function __construct(protected MapInsightsService $service) {}

    /**
     * @OA\Get(
     *     path="/fosas/thematic",
     *     operationId="getFosaThematic",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="Analyse thématique de la carte",
     *     description="Par entité géographique : nombre de FOSA, titres fonciers, clôtures, électrification (oui / non / non renseigné), rattachement par géométrie.",
     *     @OA\Parameter(name="level", in="query", required=true, @OA\Schema(type="string", enum={"region","departement","arrondissement","district","airesante"})),
     *     @OA\Parameter(name="region_id", in="query", required=false, @OA\Schema(type="integer"), description="Requis pour level=district ; optionnel pour departement"),
     *     @OA\Parameter(name="departement_id", in="query", required=false, @OA\Schema(type="integer"), description="Requis pour level=arrondissement"),
     *     @OA\Parameter(name="district_id", in="query", required=false, @OA\Schema(type="integer"), description="Requis pour level=airesante"),
     *     @OA\Response(response=200, description="OK"),
     *     @OA\Response(response=422, description="Paramètres invalides")
     * )
     */
    public function thematic(Request $request): JsonResponse
    {
        $level = (string) $request->query('level', 'region');
        if (!in_array($level, MapInsightsService::LEVELS, true)) {
            return $this->errorResponse('Niveau géographique invalide : ' . implode(', ', MapInsightsService::LEVELS) . '.', 422);
        }

        $parentParam = MapInsightsService::PARENTS[$level];
        $parentId = null;
        if ($parentParam) {
            $camel = lcfirst(str_replace('_', '', ucwords($parentParam, '_')));
            $raw = $request->query($parentParam, $request->query($camel));
            if ($raw !== null && $raw !== '' && !ctype_digit((string) $raw)) {
                return $this->errorResponse("Le paramètre {$parentParam} doit être un entier.", 422);
            }
            $parentId = $raw !== null && $raw !== '' ? (int) $raw : null;
            // Seul le niveau département peut être calculé à l'échelle nationale.
            if ($parentId === null && $level !== 'departement') {
                return $this->errorResponse("Le paramètre {$parentParam} est requis pour le niveau {$level}.", 422);
            }
        }

        return $this->successResponse($this->service->thematic($level, $parentId));
    }

    /**
     * @OA\Get(
     *     path="/fosas/{id}/details",
     *     operationId="getFosaMapDetails",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="Fiche détaillée d'une FOSA pour la carte",
     *     description="Identité, localisation (région, département, arrondissement, district, aire de santé), sécurité foncière, contacts, services, personnel, équipements et véhicules, depuis la base.",
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="OK"),
     *     @OA\Response(response=404, description="FOSA non trouvée")
     * )
     */
    public function details(int $id): JsonResponse
    {
        $details = $this->service->fosaDetails($id);
        if (!$details) {
            return $this->errorResponse('FOSA non trouvée', 404);
        }

        return $this->successResponse($details);
    }
}
