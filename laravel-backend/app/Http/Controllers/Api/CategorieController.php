<?php

namespace App\Http\Controllers\Api;

use App\Models\Categorie;

/**
 * @OA\Tag(name="Categories", description="Gestion des categories")
 */
class CategorieController extends CrudController
{
    protected string $modelClass = Categorie::class;
    protected string $resourceName = 'categorie';
    protected array $relations = ['personnels'];
    protected array $filterFields = ['type'];
    protected array $validationRules = [
        'nom' => 'required|string|max:100',
        'type' => 'nullable|string|max:50',
    ];

    /**
     * @OA\Get(
     *     path="/categories",
     *     operationId="getCategories",
     *     tags={"Categories"},
     *     summary="Liste paginee des categories",
     *     description="Retourne la liste paginee des categories avec filtre optionnel par type.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="type", in="query", required=false, @OA\Schema(type="string"), description="Filtrer par type"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des categories recuperee avec succes",
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
     *     path="/categories/{id}",
     *     operationId="getCategorie",
     *     tags={"Categories"},
     *     summary="Details d'une categorie",
     *     description="Retourne les details complets d'une categorie avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la categorie"),
     *     @OA\Response(response=200, description="Categorie recuperee avec succes"),
     *     @OA\Response(response=404, description="Categorie non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/categories",
     *     operationId="createCategorie",
     *     tags={"Categories"},
     *     summary="Creer une categorie",
     *     description="Cree une nouvelle categorie.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom"},
     *         @OA\Property(property="nom", type="string", example="Medecin"),
     *         @OA\Property(property="type", type="string")
     *     )),
     *     @OA\Response(response=201, description="Categorie creee avec succes"),
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
     *     path="/categories/{id}",
     *     operationId="updateCategorie",
     *     tags={"Categories"},
     *     summary="Mettre a jour une categorie",
     *     description="Met a jour une categorie existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la categorie"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="type", type="string")
     *     )),
     *     @OA\Response(response=200, description="Categorie mise a jour avec succes"),
     *     @OA\Response(response=404, description="Categorie non trouvee"),
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
     *     path="/categories/{id}",
     *     operationId="deleteCategorie",
     *     tags={"Categories"},
     *     summary="Supprimer une categorie",
     *     description="Supprime une categorie existante.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la categorie"),
     *     @OA\Response(response=200, description="Categorie supprimee avec succes"),
     *     @OA\Response(response=404, description="Categorie non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
