<?php

namespace App\Http\Controllers\Api;

use App\Models\Degradation;

/**
 * @OA\Tag(name="Degradations", description="Gestion des degradations")
 */
class DegradationController extends CrudController
{
    protected string $modelClass = Degradation::class;
    protected string $resourceName = 'degradation';
    protected array $relations = ['batiments'];
    protected array $filterFields = [];
    protected array $validationRules = [
        'type' => 'required|string|max:100',
    ];

    /**
     * @OA\Get(
     *     path="/degradations",
     *     operationId="getDegradations",
     *     tags={"Degradations"},
     *     summary="Liste paginee des degradations",
     *     description="Retourne la liste paginee des degradations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des degradations recuperee avec succes",
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
     *     path="/degradations/{id}",
     *     operationId="getDegradation",
     *     tags={"Degradations"},
     *     summary="Details d'une degradation",
     *     description="Retourne les details complets d'une degradation avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la degradation"),
     *     @OA\Response(response=200, description="Degradation recuperee avec succes"),
     *     @OA\Response(response=404, description="Degradation non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/degradations",
     *     operationId="createDegradation",
     *     tags={"Degradations"},
     *     summary="Creer une degradation",
     *     description="Cree une nouvelle degradation.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom"},
     *         @OA\Property(property="nom", type="string", example="Fissures"),
     *         @OA\Property(property="description", type="string"),
     *         @OA\Property(property="niveau", type="string")
     *     )),
     *     @OA\Response(response=201, description="Degradation creee avec succes"),
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
     *     path="/degradations/{id}",
     *     operationId="updateDegradation",
     *     tags={"Degradations"},
     *     summary="Mettre a jour une degradation",
     *     description="Met a jour une degradation existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la degradation"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="description", type="string"),
     *         @OA\Property(property="niveau", type="string")
     *     )),
     *     @OA\Response(response=200, description="Degradation mise a jour avec succes"),
     *     @OA\Response(response=404, description="Degradation non trouvee"),
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
     *     path="/degradations/{id}",
     *     operationId="deleteDegradation",
     *     tags={"Degradations"},
     *     summary="Supprimer une degradation",
     *     description="Supprime une degradation existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la degradation"),
     *     @OA\Response(response=200, description="Degradation supprimee avec succes"),
     *     @OA\Response(response=404, description="Degradation non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
