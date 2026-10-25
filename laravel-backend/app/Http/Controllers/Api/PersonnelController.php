<?php

namespace App\Http\Controllers\Api;

use App\Models\Personnel;

/**
 * @OA\Tag(name="Personnel", description="Gestion du personnel")
 */
class PersonnelController extends CrudController
{
    protected string $modelClass = Personnel::class;
    protected string $resourceName = 'personnel';
    protected array $relations = ['fosa', 'categorie', 'service'];
    protected array $filterFields = ['fosa_id', 'categorie_id', 'service_id'];
    protected array $validationRules = [
        'nom' => 'required|string|max:100',
        'prenom' => 'nullable|string|max:100',
        'matricule' => 'nullable|string|max:50|unique:personnels,matricule',
        'grade' => 'nullable|string|max:100',
        'fosa_id' => 'required|exists:tmpfosa,id',
        'categorie_id' => 'nullable|exists:categories,id',
    ];

    /**
     * @OA\Get(
     *     path="/personnels",
     *     operationId="getPersonnels",
     *     tags={"Personnel"},
     *     summary="Liste paginee du personnel",
     *     description="Retourne la liste paginee du personnel avec filtres optionnels.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="fosa_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par FOSA"),
     *     @OA\Parameter(name="categorie_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par categorie"),
     *     @OA\Parameter(name="service_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par service"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste du personnel recuperee avec succes",
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
     *     path="/personnels/{id}",
     *     operationId="getPersonnel",
     *     tags={"Personnel"},
     *     summary="Details d'un personnel",
     *     description="Retourne les details complets d'un personnel avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du personnel"),
     *     @OA\Response(response=200, description="Personnel recupere avec succes"),
     *     @OA\Response(response=404, description="Personnel non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/personnels",
     *     operationId="createPersonnel",
     *     tags={"Personnel"},
     *     summary="Creer un personnel",
     *     description="Cree un nouveau personnel.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom", "fosa_id", "categorie_id"},
     *         @OA\Property(property="nom", type="string", example="Jean Dupont"),
     *         @OA\Property(property="fosa_id", type="integer", example=1),
     *         @OA\Property(property="categorie_id", type="integer", example=1),
     *         @OA\Property(property="service_id", type="integer"),
     *         @OA\Property(property="matricule", type="string"),
     *         @OA\Property(property="specialite", type="string")
     *     )),
     *     @OA\Response(response=201, description="Personnel cree avec succes"),
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
     *     path="/personnels/{id}",
     *     operationId="updatePersonnel",
     *     tags={"Personnel"},
     *     summary="Mettre a jour un personnel",
     *     description="Met a jour un personnel existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du personnel"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="fosa_id", type="integer"),
     *         @OA\Property(property="categorie_id", type="integer"),
     *         @OA\Property(property="service_id", type="integer"),
     *         @OA\Property(property="matricule", type="string"),
     *         @OA\Property(property="specialite", type="string")
     *     )),
     *     @OA\Response(response=200, description="Personnel mis a jour avec succes"),
     *     @OA\Response(response=404, description="Personnel non trouve"),
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
     *     path="/personnels/{id}",
     *     operationId="deletePersonnel",
     *     tags={"Personnel"},
     *     summary="Supprimer un personnel",
     *     description="Supprime un personnel existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du personnel"),
     *     @OA\Response(response=200, description="Personnel supprime avec succes"),
     *     @OA\Response(response=404, description="Personnel non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
