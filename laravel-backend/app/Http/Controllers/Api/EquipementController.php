<?php

namespace App\Http\Controllers\Api;

use App\Models\Equipement;

/**
 * @OA\Tag(name="Equipements", description="Gestion des equipements")
 */
class EquipementController extends CrudController
{
    protected string $modelClass = Equipement::class;
    protected string $resourceName = 'equipement';
    protected array $relations = ['fosa', 'service'];
    protected array $filterFields = ['service_id', 'type'];
    // La table equipements n'a pas de colonne fosa_id : on filtre via le service.
    protected array $relationFilters = ['fosa_id' => ['service', 'fosa_id']];
    protected array $validationRules = [
        'nom' => 'required|string|max:200',
        'type' => 'nullable|string|max:100',
        'date_acquisition' => 'nullable|date',
        'service_id' => 'nullable|exists:services,id',
        'description' => 'nullable|string',
    ];

    /**
     * @OA\Get(
     *     path="/equipements",
     *     operationId="getEquipements",
     *     tags={"Equipements"},
     *     summary="Liste paginee des equipements",
     *     description="Retourne la liste paginee des equipements avec filtres optionnels.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="fosa_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par FOSA"),
     *     @OA\Parameter(name="service_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par service"),
     *     @OA\Parameter(name="type", in="query", required=false, @OA\Schema(type="string"), description="Filtrer par type"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des equipements recuperee avec succes",
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
     *     path="/equipements/{id}",
     *     operationId="getEquipement",
     *     tags={"Equipements"},
     *     summary="Details d'un equipement",
     *     description="Retourne les details complets d'un equipement avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'equipement"),
     *     @OA\Response(response=200, description="Equipement recupere avec succes"),
     *     @OA\Response(response=404, description="Equipement non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/equipements",
     *     operationId="createEquipement",
     *     tags={"Equipements"},
     *     summary="Creer un equipement",
     *     description="Cree un nouvel equipement.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom", "fosa_id"},
     *         @OA\Property(property="nom", type="string", example="Echographe"),
     *         @OA\Property(property="fosa_id", type="integer", example=1),
     *         @OA\Property(property="service_id", type="integer"),
     *         @OA\Property(property="type", type="string"),
     *         @OA\Property(property="quantite", type="integer"),
     *         @OA\Property(property="etat", type="string")
     *     )),
     *     @OA\Response(response=201, description="Equipement cree avec succes"),
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
     *     path="/equipements/{id}",
     *     operationId="updateEquipement",
     *     tags={"Equipements"},
     *     summary="Mettre a jour un equipement",
     *     description="Met a jour un equipement existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'equipement"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="fosa_id", type="integer"),
     *         @OA\Property(property="service_id", type="integer"),
     *         @OA\Property(property="type", type="string"),
     *         @OA\Property(property="quantite", type="integer"),
     *         @OA\Property(property="etat", type="string")
     *     )),
     *     @OA\Response(response=200, description="Equipement mis a jour avec succes"),
     *     @OA\Response(response=404, description="Equipement non trouve"),
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
     *     path="/equipements/{id}",
     *     operationId="deleteEquipement",
     *     tags={"Equipements"},
     *     summary="Supprimer un equipement",
     *     description="Supprime un equipement existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'equipement"),
     *     @OA\Response(response=200, description="Equipement supprime avec succes"),
     *     @OA\Response(response=404, description="Equipement non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
