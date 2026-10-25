<?php

namespace App\Http\Controllers\Api;

use App\Models\Departement;

/**
 * @OA\Tag(name="Départements", description="Gestion des départements")
 */
class DepartementController extends CrudController
{
    protected string $modelClass = Departement::class;
    protected string $resourceName = 'departements';
    protected array $relations = ['region', 'arrondissements'];
    protected array $filterFields = ['region_id'];
    protected array $validationRules = [
        'departement' => 'required|string|max:191',
        'region_id' => 'required|exists:regions,id',
        'fit1' => 'nullable|numeric',
        'fit2' => 'nullable|numeric',
        'fit3' => 'nullable|numeric',
        'fit4' => 'nullable|numeric',
    ];

    /** @OA\Get(path="/departements", tags={"Départements"}, summary="Liste des départements", security={{"bearerAuth":{}}}, @OA\Response(response=200, description="OK")) */
    public function index(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse { return parent::index($request); }
    /** @OA\Get(path="/departements/{id}", tags={"Départements"}, summary="Détails", security={{"bearerAuth":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK")) */
    public function show(int $id): \Illuminate\Http\JsonResponse { return parent::show($id); }
    /** @OA\Post(path="/departements", tags={"Départements"}, summary="Créer", security={{"bearerAuth":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(required={"nom","region_id"}, @OA\Property(property="nom", type="string"), @OA\Property(property="region_id", type="integer"), @OA\Property(property="population", type="integer"), @OA\Property(property="chef_lieu", type="string"))), @OA\Response(response=201, description="Créé")) */
    public function store(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse { return parent::store($request); }
    /** @OA\Put(path="/departements/{id}", tags={"Départements"}, summary="Modifier", security={{"bearerAuth":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\RequestBody(required=true, @OA\JsonContent()), @OA\Response(response=200, description="OK")) */
    public function update(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse { return parent::update($request, $id); }
    /** @OA\Delete(path="/departements/{id}", tags={"Départements"}, summary="Supprimer", security={{"bearerAuth":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK")) */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse { return parent::destroy($request, $id); }
}
