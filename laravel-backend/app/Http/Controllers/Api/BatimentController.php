<?php

namespace App\Http\Controllers\Api;

use App\Models\Batiment;

/**
 * @OA\Tag(name="Batiments", description="Gestion des batiments")
 */
class BatimentController extends CrudController
{
    protected string $modelClass = Batiment::class;
    protected string $resourceName = 'batiment';
    protected array $relations = ['fosa', 'degradation', 'services'];
    protected array $filterFields = ['fosa_id', 'etat'];
    protected array $validationRules = [
        'nom' => 'required|string|max:255',
        'type' => 'nullable|string|max:255',
        'etat' => 'nullable|string|max:50',
        'fosa_id' => 'required|exists:tmpfosa,id',
        'degradation_id' => 'nullable|exists:degradations,id',
        'superficie' => 'nullable|numeric',
        'anne_construction' => 'nullable|integer',
        'description' => 'nullable|string',
    ];

    /**
     * @OA\Get(
     *     path="/batiments",
     *     operationId="getBatiments",
     *     tags={"Batiments"},
     *     summary="Liste paginee des batiments",
     *     description="Retourne la liste paginee des batiments avec filtres optionnels par fosa_id et etat.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="fosa_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par FOSA"),
     *     @OA\Parameter(name="etat", in="query", required=false, @OA\Schema(type="string"), description="Filtrer par etat"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des batiments recuperee avec succes",
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
     *     path="/batiments/{id}",
     *     operationId="getBatiment",
     *     tags={"Batiments"},
     *     summary="Details d'un batiment",
     *     description="Retourne les details complets d'un batiment avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du batiment"),
     *     @OA\Response(response=200, description="Batiment recupere avec succes"),
     *     @OA\Response(response=404, description="Batiment non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/batiments",
     *     operationId="createBatiment",
     *     tags={"Batiments"},
     *     summary="Creer un batiment",
     *     description="Cree un nouveau batiment rattache a une FOSA.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom", "fosa_id"},
     *         @OA\Property(property="nom", type="string", example="Batiment A"),
     *         @OA\Property(property="fosa_id", type="integer", example=1),
     *         @OA\Property(property="type", type="string"),
     *         @OA\Property(property="nombre_etages", type="integer"),
     *         @OA\Property(property="annee_construction", type="integer"),
     *         @OA\Property(property="superficie", type="number", format="double"),
     *         @OA\Property(property="etat", type="string"),
     *         @OA\Property(property="degradation_id", type="integer")
     *     )),
     *     @OA\Response(response=201, description="Batiment cree avec succes"),
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
     *     path="/batiments/{id}",
     *     operationId="updateBatiment",
     *     tags={"Batiments"},
     *     summary="Mettre a jour un batiment",
     *     description="Met a jour un batiment existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du batiment"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="fosa_id", type="integer"),
     *         @OA\Property(property="type", type="string"),
     *         @OA\Property(property="nombre_etages", type="integer"),
     *         @OA\Property(property="annee_construction", type="integer"),
     *         @OA\Property(property="superficie", type="number", format="double"),
     *         @OA\Property(property="etat", type="string"),
     *         @OA\Property(property="degradation_id", type="integer")
     *     )),
     *     @OA\Response(response=200, description="Batiment mis a jour avec succes"),
     *     @OA\Response(response=404, description="Batiment non trouve"),
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
     *     path="/batiments/{id}",
     *     operationId="deleteBatiment",
     *     tags={"Batiments"},
     *     summary="Supprimer un batiment",
     *     description="Supprime un batiment existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du batiment"),
     *     @OA\Response(response=200, description="Batiment supprime avec succes"),
     *     @OA\Response(response=404, description="Batiment non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
