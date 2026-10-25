<?php

namespace App\Http\Controllers\Api;

use App\Models\Commune;

/**
 * @OA\Tag(name="Communes", description="Gestion des communes")
 */
class CommuneController extends CrudController
{
    protected string $modelClass = Commune::class;
    protected string $resourceName = 'commune';
    protected array $relations = ['departement'];
    protected array $filterFields = ['departement_id'];
    protected array $validationRules = [
        'commune' => 'required|string|max:191',
        'departement_id' => 'required|exists:departements,id',
        'superficie' => 'nullable|numeric',
        'fit1' => 'nullable|numeric',
        'fit2' => 'nullable|numeric',
        'fit3' => 'nullable|numeric',
        'fit4' => 'nullable|numeric',
        'division' => 'nullable|string|max:191',
    ];

    /**
     * @OA\Get(
     *     path="/communes",
     *     operationId="getCommunes",
     *     tags={"Communes"},
     *     summary="Liste paginee des communes",
     *     description="Retourne la liste paginee des communes avec filtre optionnel par departement_id.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="departement_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par departement"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des communes recuperee avec succes",
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
     *     path="/communes/{id}",
     *     operationId="getCommune",
     *     tags={"Communes"},
     *     summary="Details d'une commune",
     *     description="Retourne les details complets d'une commune avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la commune"),
     *     @OA\Response(response=200, description="Commune recuperee avec succes"),
     *     @OA\Response(response=404, description="Commune non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/communes",
     *     operationId="createCommune",
     *     tags={"Communes"},
     *     summary="Creer une commune",
     *     description="Cree une nouvelle commune.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom", "departement_id"},
     *         @OA\Property(property="nom", type="string", example="Douala 1er"),
     *         @OA\Property(property="departement_id", type="integer", example=1)
     *     )),
     *     @OA\Response(response=201, description="Commune creee avec succes"),
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
     *     path="/communes/{id}",
     *     operationId="updateCommune",
     *     tags={"Communes"},
     *     summary="Mettre a jour une commune",
     *     description="Met a jour une commune existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la commune"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="departement_id", type="integer")
     *     )),
     *     @OA\Response(response=200, description="Commune mise a jour avec succes"),
     *     @OA\Response(response=404, description="Commune non trouvee"),
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
     *     path="/communes/{id}",
     *     operationId="deleteCommune",
     *     tags={"Communes"},
     *     summary="Supprimer une commune",
     *     description="Supprime une commune existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la commune"),
     *     @OA\Response(response=200, description="Commune supprimee avec succes"),
     *     @OA\Response(response=404, description="Commune non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
