<?php

namespace App\Http\Controllers\Api;

use App\Models\Service;

/**
 * @OA\Tag(name="Services", description="Gestion des services")
 */
class ServiceController extends CrudController
{
    protected string $modelClass = Service::class;
    protected string $resourceName = 'service';
    // 'personnels' retiré : la table personnels n'a pas de colonne service_id
    // (les personnels sont rattachés aux FOSA via fosa_id, pas aux services).
    protected array $relations = ['fosa', 'batiment'];
    protected array $filterFields = ['fosa_id', 'batiment_id'];
    protected array $validationRules = [
        'nom' => 'required|string|max:255',
        'responsable' => 'nullable|string|max:255',
        'date_creation' => 'nullable|date',
        'batiment_id' => 'nullable|exists:batiments,id',
        'fosa_id' => 'required|exists:tmpfosa,id',
        'capacite' => 'nullable|integer',
        'description' => 'nullable|string',
    ];

    /**
     * @OA\Get(
     *     path="/services",
     *     operationId="getServices",
     *     tags={"Services"},
     *     summary="Liste paginee des services",
     *     description="Retourne la liste paginee des services avec filtres optionnels par fosa_id et batiment_id.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="fosa_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par FOSA"),
     *     @OA\Parameter(name="batiment_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par batiment"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des services recuperee avec succes",
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
     *     path="/services/{id}",
     *     operationId="getService",
     *     tags={"Services"},
     *     summary="Details d'un service",
     *     description="Retourne les details complets d'un service avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du service"),
     *     @OA\Response(response=200, description="Service recupere avec succes"),
     *     @OA\Response(response=404, description="Service non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/services",
     *     operationId="createService",
     *     tags={"Services"},
     *     summary="Creer un service",
     *     description="Cree un nouveau service rattache a une FOSA et un batiment.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom", "fosa_id"},
     *         @OA\Property(property="nom", type="string", example="Chirurgie"),
     *         @OA\Property(property="fosa_id", type="integer", example=1),
     *         @OA\Property(property="batiment_id", type="integer"),
     *         @OA\Property(property="description", type="string"),
     *         @OA\Property(property="capacite", type="integer"),
     *         @OA\Property(property="responsable", type="string")
     *     )),
     *     @OA\Response(response=201, description="Service cree avec succes"),
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
     *     path="/services/{id}",
     *     operationId="updateService",
     *     tags={"Services"},
     *     summary="Mettre a jour un service",
     *     description="Met a jour un service existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du service"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="fosa_id", type="integer"),
     *         @OA\Property(property="batiment_id", type="integer"),
     *         @OA\Property(property="description", type="string"),
     *         @OA\Property(property="capacite", type="integer"),
     *         @OA\Property(property="responsable", type="string")
     *     )),
     *     @OA\Response(response=200, description="Service mis a jour avec succes"),
     *     @OA\Response(response=404, description="Service non trouve"),
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
     *     path="/services/{id}",
     *     operationId="deleteService",
     *     tags={"Services"},
     *     summary="Supprimer un service",
     *     description="Supprime un service existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du service"),
     *     @OA\Response(response=200, description="Service supprime avec succes"),
     *     @OA\Response(response=404, description="Service non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
