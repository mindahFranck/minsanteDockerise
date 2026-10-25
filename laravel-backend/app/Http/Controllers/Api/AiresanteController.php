<?php

namespace App\Http\Controllers\Api;

use App\Models\Airesante;
use App\Services\MapService;

/**
 * @OA\Tag(name="Aires de Sante", description="Gestion des aires de sante")
 */
class AiresanteController extends CrudController
{
    protected MapService $mapService;

    public function __construct(\App\Services\AuditService $auditService, MapService $mapService)
    {
        parent::__construct($auditService);
        $this->mapService = $mapService;
    }

    protected string $modelClass = Airesante::class;
    protected string $resourceName = 'aire_de_sante';
    protected array $relations = ['district'];
    protected array $filterFields = ['district_id'];
    protected array $validationRules = [
        'nom_as' => 'required|string',
        'nom_dist' => 'nullable|string',
        'code_as' => 'nullable|string',
        'area' => 'nullable|numeric',
        'district_id' => 'required|exists:districts,id',
    ];

    /**
     * @OA\Get(
     *     path="/airesantes",
     *     operationId="getAiresantes",
     *     tags={"Aires de Sante"},
     *     summary="Liste paginee des aires de sante",
     *     description="Retourne la liste paginee des aires de sante avec filtre optionnel par district_id.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="district_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par district"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des aires de sante recuperee avec succes",
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
        $query = \Illuminate\Support\Facades\DB::table('airesantes')
            ->select('id', 'nom_as', 'nom_dist', 'code_as', 'area', 'district_id', 'created_at', 'updated_at');

        if ($request->filled('district_id')) {
            $query->where('district_id', $request->input('district_id'));
        }

        $rows = $query->get();
        $items = $rows->map(function ($item) {
            $item = (array) $item;
            if (isset($item['district_id'])) { $item['districtId'] = $item['district_id']; unset($item['district_id']); }
            return $item;
        });

        return response()->json([
            'success' => true,
            'data' => $items->values(),
            'pagination' => ['page' => 1, 'total' => $items->count(), 'totalPages' => 1],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/airesantes/{id}",
     *     operationId="getAiresante",
     *     tags={"Aires de Sante"},
     *     summary="Details d'une aire de sante",
     *     description="Retourne les details complets d'une aire de sante avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'aire de sante"),
     *     @OA\Response(response=200, description="Aire de sante recuperee avec succes"),
     *     @OA\Response(response=404, description="Aire de sante non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/airesantes",
     *     operationId="createAiresante",
     *     tags={"Aires de Sante"},
     *     summary="Creer une aire de sante",
     *     description="Cree une nouvelle aire de sante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom", "district_id"},
     *         @OA\Property(property="nom", type="string", example="Aire de sante de Douala"),
     *         @OA\Property(property="district_id", type="integer", example=1)
     *     )),
     *     @OA\Response(response=201, description="Aire de sante creee avec succes"),
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
     *     path="/airesantes/{id}",
     *     operationId="updateAiresante",
     *     tags={"Aires de Sante"},
     *     summary="Mettre a jour une aire de sante",
     *     description="Met a jour une aire de sante existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'aire de sante"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="district_id", type="integer")
     *     )),
     *     @OA\Response(response=200, description="Aire de sante mise a jour avec succes"),
     *     @OA\Response(response=404, description="Aire de sante non trouvee"),
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
     *     path="/airesantes/{id}",
     *     operationId="deleteAiresante",
     *     tags={"Aires de Sante"},
     *     summary="Supprimer une aire de sante",
     *     description="Supprime une aire de sante existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'aire de sante"),
     *     @OA\Response(response=200, description="Aire de sante supprimee avec succes"),
     *     @OA\Response(response=404, description="Aire de sante non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }

    public function mapAll(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        return $this->successResponse($this->mapService->getAllAiresantesForMap($request->input('limit'), $request->input('offset')));
    }

    public function mapById(int $id): \Illuminate\Http\JsonResponse
    {
        $data = $this->mapService->getAiresanteByIdForMap($id);
        if (!$data) return $this->errorResponse('Aire de santé non trouvée', 404);
        return $this->successResponse($data);
    }

    public function mapByDistrict(int $districtId): \Illuminate\Http\JsonResponse
    {
        return $this->successResponse($this->mapService->getAiresantesByDistrictForMap($districtId));
    }
}
