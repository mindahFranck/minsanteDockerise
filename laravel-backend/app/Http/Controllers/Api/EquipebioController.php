<?php

namespace App\Http\Controllers\Api;

use App\Models\Equipebio;

/**
 * @OA\Tag(name="Equipements Biomedicaux", description="Gestion des equipements biomedicaux")
 */
class EquipebioController extends CrudController
{
    protected string $modelClass = Equipebio::class;
    protected string $resourceName = 'equipement_biomedical';
    protected array $relations = ['fosa', 'service'];
    protected array $filterFields = ['service_id'];
    // La table equipebios n'a pas de colonne fosa_id : on filtre via le service.
    protected array $relationFilters = ['fosa_id' => ['service', 'fosa_id']];
    protected array $validationRules = [
        'nom' => 'required|string|max:200',
        'type' => 'nullable|string|max:100',
        'quantite' => 'nullable|integer|min:0',
        'etat' => 'nullable|string|max:50',
        'date_acquisition' => 'nullable|date',
        'service_id' => 'nullable|exists:services,id',
        'description' => 'nullable|string',
    ];

    /**
     * @OA\Get(
     *     path="/equipebios",
     *     operationId="getEquipebios",
     *     tags={"Equipements Biomedicaux"},
     *     summary="Liste paginee des equipements biomedicaux",
     *     description="Retourne la liste paginee des equipements biomedicaux avec filtres optionnels.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="fosa_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par FOSA"),
     *     @OA\Parameter(name="service_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par service"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des equipements biomedicaux recuperee avec succes",
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
     *     path="/equipebios/{id}",
     *     operationId="getEquipebio",
     *     tags={"Equipements Biomedicaux"},
     *     summary="Details d'un equipement biomedical",
     *     description="Retourne les details complets d'un equipement biomedical avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'equipement biomedical"),
     *     @OA\Response(response=200, description="Equipement biomedical recupere avec succes"),
     *     @OA\Response(response=404, description="Equipement biomedical non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/equipebios",
     *     operationId="createEquipebio",
     *     tags={"Equipements Biomedicaux"},
     *     summary="Creer un equipement biomedical",
     *     description="Cree un nouvel equipement biomedical.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom", "fosa_id"},
     *         @OA\Property(property="nom", type="string", example="Scanner"),
     *         @OA\Property(property="fosa_id", type="integer", example=1),
     *         @OA\Property(property="service_id", type="integer"),
     *         @OA\Property(property="marque", type="string"),
     *         @OA\Property(property="modele", type="string"),
     *         @OA\Property(property="etat", type="string")
     *     )),
     *     @OA\Response(response=201, description="Equipement biomedical cree avec succes"),
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
     *     path="/equipebios/{id}",
     *     operationId="updateEquipebio",
     *     tags={"Equipements Biomedicaux"},
     *     summary="Mettre a jour un equipement biomedical",
     *     description="Met a jour un equipement biomedical existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'equipement biomedical"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="fosa_id", type="integer"),
     *         @OA\Property(property="service_id", type="integer"),
     *         @OA\Property(property="marque", type="string"),
     *         @OA\Property(property="modele", type="string"),
     *         @OA\Property(property="etat", type="string")
     *     )),
     *     @OA\Response(response=200, description="Equipement biomedical mis a jour avec succes"),
     *     @OA\Response(response=404, description="Equipement biomedical non trouve"),
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
     *     path="/equipebios/{id}",
     *     operationId="deleteEquipebio",
     *     tags={"Equipements Biomedicaux"},
     *     summary="Supprimer un equipement biomedical",
     *     description="Supprime un equipement biomedical existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'equipement biomedical"),
     *     @OA\Response(response=200, description="Equipement biomedical supprime avec succes"),
     *     @OA\Response(response=404, description="Equipement biomedical non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
