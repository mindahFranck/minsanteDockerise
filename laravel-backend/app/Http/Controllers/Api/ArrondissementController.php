<?php

namespace App\Http\Controllers\Api;

use App\Models\Arrondissement;

/** @OA\Tag(name="Arrondissements", description="Gestion des arrondissements") */
class ArrondissementController extends CrudController
{
    protected string $modelClass = Arrondissement::class;
    protected string $resourceName = 'arrondissements';
    protected array $relations = ['departement'];
    protected array $filterFields = ['departement_id'];
    protected array $validationRules = [
        'nom' => 'required|string|max:191',
        'departement_id' => 'required|exists:departements,id',
        'superficie' => 'nullable|numeric',
        'fit1' => 'nullable|numeric',
        'fit2' => 'nullable|numeric',
        'fit3' => 'nullable|numeric',
        'fit4' => 'nullable|numeric',
        'division' => 'nullable|string|max:191',
    ];

    /** @OA\Get(path="/arrondissements", tags={"Arrondissements"}, summary="Liste", security={{"bearerAuth":{}}}, @OA\Response(response=200, description="OK")) */
    public function index(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse { return parent::index($request); }
    /** @OA\Get(path="/arrondissements/{id}", tags={"Arrondissements"}, summary="Détails", security={{"bearerAuth":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK")) */
    public function show(int $id): \Illuminate\Http\JsonResponse { return parent::show($id); }
    /** @OA\Post(path="/arrondissements", tags={"Arrondissements"}, summary="Créer", security={{"bearerAuth":{}}}, @OA\RequestBody(required=true, @OA\JsonContent(required={"nom","departement_id"}, @OA\Property(property="nom", type="string"), @OA\Property(property="departement_id", type="integer"))), @OA\Response(response=201, description="Créé")) */
    public function store(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse { return parent::store($request); }
    /** @OA\Put(path="/arrondissements/{id}", tags={"Arrondissements"}, summary="Modifier", security={{"bearerAuth":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\RequestBody(required=true, @OA\JsonContent()), @OA\Response(response=200, description="OK")) */
    public function update(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse { return parent::update($request, $id); }
    /** @OA\Delete(path="/arrondissements/{id}", tags={"Arrondissements"}, summary="Supprimer", security={{"bearerAuth":{}}}, @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")), @OA\Response(response=200, description="OK")) */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse { return parent::destroy($request, $id); }
}
