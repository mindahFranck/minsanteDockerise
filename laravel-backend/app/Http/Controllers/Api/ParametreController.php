<?php

namespace App\Http\Controllers\Api;

use App\Models\Parametre;

/**
 * @OA\Tag(name="Parametres", description="Gestion des parametres")
 */
class ParametreController extends CrudController
{
    protected string $modelClass = Parametre::class;
    protected string $resourceName = 'parametre';
    protected array $relations = ['fosa'];
    protected array $filterFields = ['fosa_id'];
    protected array $validationRules = [
        'nombre_patients_ambulants' => 'nullable|integer|min:0',
        'nombre_patients_totaux' => 'nullable|integer|min:0',
        'liste_operationnelle' => 'nullable|string',
        'date' => 'nullable|date',
        'fosa_id' => 'nullable|exists:tmpfosa,id',
    ];

    /**
     * @OA\Get(
     *     path="/parametres",
     *     operationId="getParametres",
     *     tags={"Parametres"},
     *     summary="Liste paginee des parametres",
     *     description="Retourne la liste paginee des parametres avec filtre optionnel par fosa_id.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="fosa_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par FOSA"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des parametres recuperee avec succes",
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
     *     path="/parametres/{id}",
     *     operationId="getParametre",
     *     tags={"Parametres"},
     *     summary="Details d'un parametre",
     *     description="Retourne les details complets d'un parametre avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du parametre"),
     *     @OA\Response(response=200, description="Parametre recupere avec succes"),
     *     @OA\Response(response=404, description="Parametre non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/parametres",
     *     operationId="createParametre",
     *     tags={"Parametres"},
     *     summary="Creer un parametre",
     *     description="Cree un nouveau parametre.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"cle", "valeur"},
     *         @OA\Property(property="cle", type="string", example="capacite_lits"),
     *         @OA\Property(property="valeur", type="string", example="100"),
     *         @OA\Property(property="fosa_id", type="integer")
     *     )),
     *     @OA\Response(response=201, description="Parametre cree avec succes"),
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
     *     path="/parametres/{id}",
     *     operationId="updateParametre",
     *     tags={"Parametres"},
     *     summary="Mettre a jour un parametre",
     *     description="Met a jour un parametre existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du parametre"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="cle", type="string"),
     *         @OA\Property(property="valeur", type="string"),
     *         @OA\Property(property="fosa_id", type="integer")
     *     )),
     *     @OA\Response(response=200, description="Parametre mis a jour avec succes"),
     *     @OA\Response(response=404, description="Parametre non trouve"),
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
     *     path="/parametres/{id}",
     *     operationId="deleteParametre",
     *     tags={"Parametres"},
     *     summary="Supprimer un parametre",
     *     description="Supprime un parametre existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du parametre"),
     *     @OA\Response(response=200, description="Parametre supprime avec succes"),
     *     @OA\Response(response=404, description="Parametre non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
