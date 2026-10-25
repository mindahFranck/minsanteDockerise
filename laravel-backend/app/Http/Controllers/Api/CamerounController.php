<?php

namespace App\Http\Controllers\Api;

use App\Models\Cameroun;

/**
 * @OA\Tag(name="Cameroun", description="Gestion des donnees Cameroun")
 */
class CamerounController extends CrudController
{
    protected string $modelClass = Cameroun::class;
    protected string $resourceName = 'cameroun';
    protected array $relations = [];
    protected array $filterFields = [];
    protected array $validationRules = [
        'forme' => 'nullable|string',
    ];

    /**
     * @OA\Get(
     *     path="/camerouns",
     *     operationId="getCamerouns",
     *     tags={"Cameroun"},
     *     summary="Liste paginee des entrees Cameroun",
     *     description="Retourne la liste paginee des entrees Cameroun avec filtre optionnel par type.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="type", in="query", required=false, @OA\Schema(type="string"), description="Filtrer par type"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste recuperee avec succes",
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
        $rows = Cameroun::selectRaw('id, forme, ST_AsGeoJSON(geom) as geojson, createdAt, updatedAt')->get();
        $data = $rows->map(function ($item) {
            $arr = $item->toArray();
            $arr['geom'] = $item->geojson ? json_decode($item->geojson) : null;
            unset($arr['geojson']);
            return $arr;
        });
        return $this->successResponse($data);
    }

    /**
     * @OA\Get(
     *     path="/camerouns/{id}",
     *     operationId="getCameroun",
     *     tags={"Cameroun"},
     *     summary="Details d'une entree Cameroun",
     *     description="Retourne les details complets d'une entree Cameroun.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'entree"),
     *     @OA\Response(response=200, description="Entree recuperee avec succes"),
     *     @OA\Response(response=404, description="Entree non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        $item = Cameroun::selectRaw('id, forme, ST_AsGeoJSON(geom) as geojson, createdAt, updatedAt')->find($id);
        if (!$item) return $this->errorResponse('Cameroun non trouvé', 404);
        $arr = $item->toArray();
        $arr['geom'] = $item->geojson ? json_decode($item->geojson) : null;
        unset($arr['geojson']);
        return $this->successResponse($arr);
    }

    /**
     * @OA\Post(
     *     path="/camerouns",
     *     operationId="createCameroun",
     *     tags={"Cameroun"},
     *     summary="Creer une entree Cameroun",
     *     description="Cree une nouvelle entree Cameroun.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string", example="Cameroun entry"),
     *         @OA\Property(property="type", type="string")
     *     )),
     *     @OA\Response(response=201, description="Entree creee avec succes"),
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
     *     path="/camerouns/{id}",
     *     operationId="updateCameroun",
     *     tags={"Cameroun"},
     *     summary="Mettre a jour une entree Cameroun",
     *     description="Met a jour une entree Cameroun existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'entree"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="type", type="string")
     *     )),
     *     @OA\Response(response=200, description="Entree mise a jour avec succes"),
     *     @OA\Response(response=404, description="Entree non trouvee"),
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
     *     path="/camerouns/{id}",
     *     operationId="deleteCameroun",
     *     tags={"Cameroun"},
     *     summary="Supprimer une entree Cameroun",
     *     description="Supprime une entree Cameroun existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'entree"),
     *     @OA\Response(response=200, description="Entree supprimee avec succes"),
     *     @OA\Response(response=404, description="Entree non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
