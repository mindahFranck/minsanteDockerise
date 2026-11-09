<?php

namespace App\Http\Controllers\Api;

use App\Models\Materielroulant;

/**
 * @OA\Tag(name="Materiel Roulant", description="Gestion du materiel roulant")
 */
class MaterielroulantController extends CrudController
{
    protected string $modelClass = Materielroulant::class;
    protected string $resourceName = 'materiel_roulant';
    // FOSA propriétaire : colonne fosa_id, sinon celle du service (sans N+1).
    protected array $relations = ['fosa:id,nom', 'service', 'service.fosa:id,nom'];
    protected array $filterFields = ['fosa_id', 'service_id', 'type', 'etat'];
    protected array $validationRules = [
        'numero_chassis' => 'nullable|string|max:100',
        'annee' => 'nullable|integer',
        'marque' => 'nullable|string|max:50',
        'modele' => 'nullable|string|max:50',
        'type' => 'nullable|string|max:50',
        'date_mise_en_circulation' => 'nullable|date',
        'etat' => 'nullable|string|max:50',
        'quantite' => 'nullable|integer|min:0',
        'fosa_id' => 'nullable|exists:tmpfosa,id',
        'date_mise_service' => 'nullable|date',
        'acte_affectation' => 'nullable|string',
        'type_vehicule' => 'nullable|string|max:100',
        'immatriculation' => 'nullable|string|max:50',
        'usage' => 'nullable|string|max:100',
        'code' => 'nullable|string|max:50',
        'structure' => 'nullable|string|max:200',
        'service_id' => 'nullable|exists:services,id',
        'nom_utilisateur' => 'nullable|string|max:200',
        'fonction_utilisateur' => 'nullable|string|max:200',
        'energie' => 'nullable|string|max:50',
        'financement' => 'nullable|string|max:200',
        // Champs recommandation ImmoSanté
        'image' => 'nullable|string|max:500',
        'nombre_places' => 'nullable|integer|min:0',
        'source_acquisition' => 'nullable|string|in:BIP,PTF,ACHAT,DON',
        'puissance_fiscale' => 'nullable|integer|min:0',
    ];

    protected function camelizeKeys(array $item): array
    {
        $item = parent::camelizeKeys($item);
        if (array_key_exists('fosa', $item) || array_key_exists('service', $item)) {
            $fosa = $item['fosa'] ?? ($item['service']['fosa'] ?? null);
            $item = $this->withOwningFosa($item, $fosa, $item['fosaId'] ?? ($item['service']['fosa_id'] ?? null));
        }
        return $item;
    }

    /**
     * @OA\Get(
     *     path="/materielroulants",
     *     operationId="getMaterielroulants",
     *     tags={"Materiel Roulant"},
     *     summary="Liste paginee du materiel roulant",
     *     description="Retourne la liste paginee du materiel roulant avec filtres optionnels.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="fosa_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par FOSA"),
     *     @OA\Parameter(name="service_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par service"),
     *     @OA\Parameter(name="type", in="query", required=false, @OA\Schema(type="string"), description="Filtrer par type"),
     *     @OA\Parameter(name="etat", in="query", required=false, @OA\Schema(type="string"), description="Filtrer par etat"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste du materiel roulant recuperee avec succes",
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
     *     path="/materielroulants/{id}",
     *     operationId="getMaterielroulant",
     *     tags={"Materiel Roulant"},
     *     summary="Details d'un materiel roulant",
     *     description="Retourne les details complets d'un materiel roulant avec ses relations.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du materiel roulant"),
     *     @OA\Response(response=200, description="Materiel roulant recupere avec succes"),
     *     @OA\Response(response=404, description="Materiel roulant non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): \Illuminate\Http\JsonResponse
    {
        return parent::show($id);
    }

    /**
     * @OA\Post(
     *     path="/materielroulants",
     *     operationId="createMaterielroulant",
     *     tags={"Materiel Roulant"},
     *     summary="Creer un materiel roulant",
     *     description="Cree un nouveau materiel roulant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"nom", "fosa_id"},
     *         @OA\Property(property="nom", type="string", example="Ambulance"),
     *         @OA\Property(property="fosa_id", type="integer", example=1),
     *         @OA\Property(property="service_id", type="integer"),
     *         @OA\Property(property="type", type="string"),
     *         @OA\Property(property="etat", type="string"),
     *         @OA\Property(property="immatriculation", type="string")
     *     )),
     *     @OA\Response(response=201, description="Materiel roulant cree avec succes"),
     *     @OA\Response(response=422, description="Erreur de validation"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function store(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $this->stashImage($request, null);
        return parent::store($request);
    }

    /**
     * @OA\Put(
     *     path="/materielroulants/{id}",
     *     operationId="updateMaterielroulant",
     *     tags={"Materiel Roulant"},
     *     summary="Mettre a jour un materiel roulant",
     *     description="Met a jour un materiel roulant existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du materiel roulant"),
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         @OA\Property(property="nom", type="string"),
     *         @OA\Property(property="fosa_id", type="integer"),
     *         @OA\Property(property="service_id", type="integer"),
     *         @OA\Property(property="type", type="string"),
     *         @OA\Property(property="etat", type="string"),
     *         @OA\Property(property="immatriculation", type="string")
     *     )),
     *     @OA\Response(response=200, description="Materiel roulant mis a jour avec succes"),
     *     @OA\Response(response=404, description="Materiel roulant non trouve"),
     *     @OA\Response(response=422, description="Erreur de validation"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function update(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        $existing = Materielroulant::find($id);
        $this->stashImage($request, $existing?->image);
        return parent::update($request, $id);
    }

    /**
     * Stocke l'image du véhicule si un fichier est envoyé (multipart) et
     * remplace la valeur de `image` par le chemin enregistré, pour que la
     * validation (string) et le mass-assignment du parent fonctionnent.
     */
    private function stashImage(\Illuminate\Http\Request $request, ?string $oldImage): void
    {
        if (!$request->hasFile('image')) {
            return;
        }
        $path = $request->file('image')->store('materielroulants', 'public');
        if ($path) {
            if ($oldImage) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldImage);
            }
            $request->merge(['image' => $path]);
        }
    }

    /**
     * @OA\Delete(
     *     path="/materielroulants/{id}",
     *     operationId="deleteMaterielroulant",
     *     tags={"Materiel Roulant"},
     *     summary="Supprimer un materiel roulant",
     *     description="Supprime un materiel roulant existant.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID du materiel roulant"),
     *     @OA\Response(response=200, description="Materiel roulant supprime avec succes"),
     *     @OA\Response(response=404, description="Materiel roulant non trouve"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(\Illuminate\Http\Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        return parent::destroy($request, $id);
    }
}
