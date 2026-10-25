<?php

namespace App\Http\Controllers\Api;

use App\Models\District;
use App\Services\MapService;

/**
 * @OA\Tag(name="Districts", description="Gestion des districts")
 */
class DistrictController extends CrudController
{
    protected MapService $mapService;

    public function __construct(\App\Services\AuditService $auditService, MapService $mapService)
    {
        parent::__construct($auditService);
        $this->mapService = $mapService;
    }

    protected string $modelClass = District::class;
    protected string $resourceName = 'district';
    protected array $relations = ['region', 'airesantes'];
    protected array $filterFields = ['region_id'];
    protected array $validationRules = [
        'nom_ds' => 'required|string',
        'code_ds' => 'nullable|string',
        'region' => 'nullable|string',
        'area' => 'nullable|numeric',
        'region_id' => 'required|exists:regions,id',
    ];

    /**
     * @OA\Get(
     *     path="/districts",
     *     operationId="getDistricts",
     *     tags={"Districts"},
     *     summary="Liste paginee des districts",
     *     description="Retourne la liste paginee des districts avec filtre optionnel par region_id.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="region_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par region"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des districts recuperee avec succes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="pagination", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifie"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function index(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        return parent::index($request);
    }

    /**
     * @OA\Get(
     *     path="/districts/{id}",
     *     operationId="getDistrict",
     *     tags={"Districts"},
     *     summary="Details d'un district",
     *     description="Retourne les details complets d'un district avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du district"),
     *     @OA\Response(response=200, description="District recupere avec succes"),
     *     @OA\Response(response=404, description="District non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/districts",
     *     operationId="createDistrict",
     *     tags={"Districts"},
     *     summary="Creer un district",
     *     description="Cree un nouveau district.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom", "region_id"},
     *         @OA\Property(property="nom", type="string", example="District de Douala"),
     *         @OA\Property(property="region_id", type="integer", example=1)
     *     )),
     *     @OA\Response(response=201, description="District cree avec succes"),
     *     @OA\Response(response=422, description="Erreur de validation"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function store(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        return parent::store($request);
    }

    /**
     * @OA\Put(
     *     path="/districts/{id}",
     *     operationId="updateDistrict",
     *     tags={"Districts"},
     *     summary="Mettre a jour un district",
     *     description="Met a jour un district existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du district"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="region_id", type="integer")
     *     )),
     *     @OA\Response(response=200, description="District mis a jour avec succes"),
     *     @OA\Response(response=404, description="District non trouve"),
     *     @OA\Response(response=422, description="Erreur de validation"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function update(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::update($request, $id);
    }

    /**
     * @OA\Delete(
     *     path="/districts/{id}",
     *     operationId="deleteDistrict",
     *     tags={"Districts"},
     *     summary="Supprimer un district",
     *     description="Supprime un district existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du district"),
     *     @OA\Response(response=200, description="District supprime avec succes"),
     *     @OA\Response(response=404, description="District non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }

    public function mapAll(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        return $this->successResponse($this->mapService->getAllDistrictsForMap($request->input('limit'), $request->input('offset')));
    }

    public function mapById(int $id): \Illuminate\Http\JsonResponse
    {
        $data = $this->mapService->getDistrictByIdForMap($id);
        if (!$data) return $this->errorResponse('District non trouvé', 404);
        return $this->successResponse($data);
    }

    public function mapByRegion(int $regionId): \Illuminate\Http\JsonResponse
    {
        return $this->successResponse($this->mapService->getDistrictsByRegionForMap($regionId));
    }
}
