<?php

namespace App\Http\Controllers\Api;

use App\Models\Region;
use App\Services\MapService;

/**
 * @OA\Tag(name="Régions", description="Gestion des régions")
 */
class RegionController extends CrudController
{
    protected MapService $mapService;

    public function __construct(\App\Services\AuditService $auditService, MapService $mapService)
    {
        parent::__construct($auditService);
        $this->mapService = $mapService;
    }

    protected string $modelClass = Region::class;
    protected string $resourceName = 'regions';
    protected array $relations = ['departements'];
    protected array $validationRules = [
        'nom' => 'required|string|max:255',
        'capitale' => 'nullable|string|max:255',
        'population' => 'nullable|integer',
        'latitude' => 'nullable|numeric|between:-90,90',
        'longitude' => 'nullable|numeric|between:-180,180',
    ];

    /**
     * @OA\Get(path="/regions", tags={"Régions"}, summary="Liste des régions", security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Liste des régions"))
     */
    public function index(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        return parent::index($request);
    }

    /**
     * @OA\Get(path="/regions/{id}", tags={"Régions"}, summary="Détails d'une région", security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détails de la région"))
     */
    public function show(int $id): \Illuminate\Http\JsonResponse { return parent::show($id); }

    /**
     * @OA\Post(path="/regions", tags={"Régions"}, summary="Créer une région", security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom"},
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="capitale", type="string"),
     *         @OA\Property(property="population", type="integer"),
     *         @OA\Property(property="latitude", type="number"),
     *         @OA\Property(property="longitude", type="number")
     *     )),
     *     @OA\Response(response=201, description="Région créée"))
     */
    public function store(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse { return parent::store($request); }

    /**
     * @OA\Put(path="/regions/{id}", tags={"Régions"}, summary="Modifier une région", security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent()),
     *     @OA\Response(response=200, description="Région modifiée"))
     */
    public function update(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse { return parent::update($request, $id); }

    /**
     * @OA\Delete(path="/regions/{id}", tags={"Régions"}, summary="Supprimer une région", security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Région supprimée"))
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse { return parent::destroy($request, $id); }

    /** @OA\Get(path="/regions/map/all", tags={"Régions"}, summary="Toutes les régions pour la carte", @OA\Response(response=200, description="OK")) */
    public function mapAll(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $data = $this->mapService->getAllRegionsForMap($request->input('limit'), $request->input('offset'));
        return $this->successResponse($data);
    }

    /** @OA\Get(path="/regions/map/{id}", tags={"Régions"}, summary="Région pour la carte", @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK")) */
    public function mapById(int $id): \Illuminate\Http\JsonResponse
    {
        $data = $this->mapService->getRegionByIdForMap($id);
        if (!$data) return $this->errorResponse('Région non trouvée', 404);
        return $this->successResponse($data);
    }

    /** @OA\Get(path="/regions/spatial/{id}", tags={"Régions"}, summary="Région avec données spatiales", @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK")) */
    public function spatial(int $id): \Illuminate\Http\JsonResponse
    {
        $data = $this->mapService->getRegionByIdForMap($id);
        if (!$data) return $this->errorResponse('Région non trouvée', 404);
        return $this->successResponse($data);
    }
}
