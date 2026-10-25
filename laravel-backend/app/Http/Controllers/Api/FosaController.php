<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FosaService;
use App\Services\AuditService;
use App\Models\Fosa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class FosaController extends Controller
{
    public function __construct(
        protected FosaService $fosaService,
        protected AuditService $auditService
    ) {}

    /**
     * @OA\Get(
     *     path="/fosas",
     *     operationId="getFosas",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="Liste paginee des FOSA",
     *     description="Retourne la liste paginee des formations sanitaires avec filtres optionnels. Le scope geographique est applique automatiquement via le middleware.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="type", in="query", required=false, @OA\Schema(type="string"), description="Filtrer par type de FOSA"),
     *     @OA\Parameter(name="arrondissement_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par arrondissement"),
     *     @OA\Parameter(name="airesante_id", in="query", required=false, @OA\Schema(type="integer"), description="Filtrer par aire de sante"),
     *     @OA\Parameter(name="est_ferme", in="query", required=false, @OA\Schema(type="boolean"), description="Filtrer par statut ouvert/ferme"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15), description="Nombre d'elements par page"),
     *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", default=1), description="Numero de page"),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des FOSA recuperee avec succes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="pagination", type="object",
     *                 @OA\Property(property="current_page", type="integer"),
     *                 @OA\Property(property="last_page", type="integer"),
     *                 @OA\Property(property="per_page", type="integer"),
     *                 @OA\Property(property="total", type="integer")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifie"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Fosa::query();

            // Apply geographic scope from middleware
            $geoFilters = $request->attributes->get('geographic_filters', []);
            foreach ($geoFilters as $column => $value) {
                if ($column === 'region_id') {
                    $query->whereHas('arrondissement.departement', fn ($q) => $q->where('region_id', $value));
                } elseif ($column === 'departement_id') {
                    $query->whereHas('arrondissement', fn ($q) => $q->where('departement_id', $value));
                } elseif ($column === 'arrondissement_id') {
                    $query->where('arrondissement_id', $value);
                }
            }

            if ($request->filled('type')) {
                $query->where('type', $request->input('type'));
            }

            if ($request->filled('arrondissement_id')) {
                $query->where('arrondissement_id', $request->input('arrondissement_id'));
            }

            if ($request->filled('airesante_id')) {
                $query->where('airesante_id', $request->input('airesante_id'));
            }

            if ($request->has('est_ferme')) {
                $query->where('est_ferme', filter_var($request->input('est_ferme'), FILTER_VALIDATE_BOOLEAN));
            }

            // Pas de pagination backend : tout retourner (pagination frontend)
            $fosas = $query->get()->map(function ($f) {
                $arr = $f->toArray();
                $originalType = $arr['type'] ?? null;
                $arr['typeOriginal'] = $originalType;
                $arr['type'] = $f->cat_rec ?: $originalType;
                $arr['categorie'] = $f->cat_rec ?: $originalType;
                $arr['statutRec'] = $f->statut_rec;
                return $arr;
            });

            return response()->json([
                'success' => true,
                'data' => $fosas,
                'pagination' => ['page' => 1, 'total' => $fosas->count(), 'totalPages' => 1],
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la recuperation des FOSA: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/{id}",
     *     operationId="getFosa",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="Details d'une FOSA",
     *     description="Retourne les details complets d'une FOSA avec toutes ses relations (batiments, services, personnels, equipements, equipebios, materielroulants, arrondissement, airesante).",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la FOSA"),
     *     @OA\Response(
     *         response=200,
     *         description="FOSA recuperee avec succes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=404, description="FOSA non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function show(int $id): JsonResponse
    {
        try {
            $fosa = Fosa::with([
                'batiments',
                'services',
                'personnels',
                'equipements',
                'equipebios',
                'materielroulants',
                'arrondissement',
                'airesante',
            ])->find($id);

            if (!$fosa) {
                return $this->errorResponse('FOSA non trouvee', 404);
            }

            return $this->successResponse($fosa, 'FOSA recuperee avec succes');
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la recuperation de la FOSA: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/fosas",
     *     operationId="createFosa",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="Creer une FOSA",
     *     description="Cree une nouvelle formation sanitaire. Roles autorises: manager, admin, super_admin.",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 required={"nom", "type", "arrondissement_id", "airesante_id"},
     *                 @OA\Property(property="nom", type="string", example="Hopital Central"),
     *                 @OA\Property(property="type", type="string", example="Hopital"),
     *                 @OA\Property(property="arrondissement_id", type="integer", example=1),
     *                 @OA\Property(property="airesante_id", type="integer", example=1),
     *                 @OA\Property(property="adresse", type="string"),
     *                 @OA\Property(property="telephone", type="string"),
     *                 @OA\Property(property="email", type="string", format="email"),
     *                 @OA\Property(property="latitude", type="number", format="double"),
     *                 @OA\Property(property="longitude", type="number", format="double"),
     *                 @OA\Property(property="nombre_lits", type="integer"),
     *                 @OA\Property(property="est_ferme", type="boolean", example=false),
     *                 @OA\Property(property="image", type="string", format="binary", description="Image de la FOSA")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="FOSA creee avec succes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=422, description="Erreur de validation"),
     *     @OA\Response(response=403, description="Acces refuse"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Convertir camelCase du frontend vers snake_case de la DB
            $camelToSnake = [
                'capaciteLits' => 'capacite_lits', 'estFerme' => 'est_ferme',
                'catRec' => 'cat_rec', 'statutRec' => 'statut_rec',
                'aCloture' => 'a_cloture', 'aTitreFoncier' => 'a_titre_foncier',
                'connecteeElectricite' => 'connectee_electricite', 'typeCourant' => 'type_courant',
                'orgUnit' => 'org_unit', 'nomDirecteur' => 'nom_directeur', 'nomDirect' => 'nom_directeur',
                'responsableNom' => 'responsable_nom', 'responsableTelephone' => 'responsable_telephone',
                'lastInspection' => 'last_inspection', 'nextInspection' => 'next_inspection',
                'maintenancePriority' => 'maintenance_priority', 'maintenanceIssues' => 'maintenance_issues',
                'arrondissementId' => 'arrondissement_id', 'airesanteId' => 'airesante_id',
            ];
            $input = $request->all();
            foreach ($camelToSnake as $camel => $snake) {
                if (array_key_exists($camel, $input)) { $input[$snake] = $input[$camel]; unset($input[$camel]); }
            }
            $boolFields = ['est_ferme', 'a_cloture', 'a_titre_foncier', 'connectee_electricite', 'fonction'];
            foreach ($boolFields as $field) {
                if (isset($input[$field])) {
                    $input[$field] = filter_var($input[$field], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ? 1 : 0;
                }
            }
            $request->merge($input);

            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'type' => 'nullable|string|max:100',
                'arrondissement_id' => 'nullable|integer|exists:arrondissements,id',
                'airesante_id' => 'nullable|integer|exists:airesantes,id',
                'situation' => 'nullable|string',
                'telephone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'capacite_lits' => 'nullable|integer|min:0',
                'est_ferme' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
                'cat_rec' => 'nullable|string|max:100',
                'responsable_nom' => 'nullable|string|max:200',
                'responsable_telephone' => 'nullable|string|max:20',
                'org_unit' => 'nullable|string|max:200',
                'statut_rec' => 'nullable|string|max:100',
                'a_cloture' => 'nullable|boolean',
                'a_titre_foncier' => 'nullable|boolean',
                'connectee_electricite' => 'nullable|boolean',
                'type_courant' => 'nullable|string|max:20',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Erreur de validation', 422, $validator->errors());
            }

            $data = $validator->validated();

            $textFields = ['situation', 'telephone', 'email', 'type_courant', 'org_unit',
                'responsable_nom', 'responsable_telephone', 'maintenance_issues', 'maintenance_priority',
                'nom_directeur', 'statut_rec', 'cat_rec'];
            foreach ($textFields as $field) {
                if (array_key_exists($field, $data) && $data[$field] === null) {
                    $data[$field] = '';
                }
            }

            if ($request->hasFile('image')) {
                $data['image'] = $request->file('image')->store('fosas', 'public');
            }

            // Build POINT geometry if coordinates provided
            if (isset($data['latitude']) && isset($data['longitude'])) {
                $data['geom'] = DB::raw("ST_GeomFromText('POINT({$data['longitude']} {$data['latitude']})', 4326)");
            }

            // CREATE : mettre cat_rec dans `type` si type n'est pas fourni
            if (isset($data['cat_rec']) && empty($data['type'])) {
                $data['type'] = $data['cat_rec'];
            }

            $fosa = Fosa::create($data);

            $this->auditService->logCreate($request->user(), 'fosas', $fosa->id, $fosa->toArray(), $request);

            return $this->successResponse($fosa, 'FOSA creee avec succes', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la creation de la FOSA: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Put(
     *     path="/fosas/{id}",
     *     operationId="updateFosa",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="Mettre a jour une FOSA",
     *     description="Met a jour une formation sanitaire existante. Roles autorises: manager, admin, super_admin.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la FOSA"),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(property="nom", type="string"),
     *                 @OA\Property(property="type", type="string"),
     *                 @OA\Property(property="arrondissement_id", type="integer"),
     *                 @OA\Property(property="airesante_id", type="integer"),
     *                 @OA\Property(property="adresse", type="string"),
     *                 @OA\Property(property="telephone", type="string"),
     *                 @OA\Property(property="email", type="string", format="email"),
     *                 @OA\Property(property="latitude", type="number", format="double"),
     *                 @OA\Property(property="longitude", type="number", format="double"),
     *                 @OA\Property(property="nombre_lits", type="integer"),
     *                 @OA\Property(property="est_ferme", type="boolean"),
     *                 @OA\Property(property="image", type="string", format="binary")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="FOSA mise a jour avec succes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=404, description="FOSA non trouvee"),
     *     @OA\Response(response=422, description="Erreur de validation"),
     *     @OA\Response(response=403, description="Acces refuse"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $fosa = Fosa::find($id);

            if (!$fosa) {
                return $this->errorResponse('FOSA non trouvee', 404);
            }

            // Convertir camelCase du frontend vers snake_case de la DB
            $camelToSnake = [
                'capaciteLits' => 'capacite_lits',
                'estFerme' => 'est_ferme',
                'catRec' => 'cat_rec',
                'statutRec' => 'statut_rec',
                'aCloture' => 'a_cloture',
                'aTitreFoncier' => 'a_titre_foncier',
                'connecteeElectricite' => 'connectee_electricite',
                'typeCourant' => 'type_courant',
                'orgUnit' => 'org_unit',
                'nomDirecteur' => 'nom_directeur',
                'nomDirect' => 'nom_directeur',
                'responsableNom' => 'responsable_nom',
                'responsableTelephone' => 'responsable_telephone',
                'lastInspection' => 'last_inspection',
                'nextInspection' => 'next_inspection',
                'maintenancePriority' => 'maintenance_priority',
                'maintenanceIssues' => 'maintenance_issues',
                'arrondissementId' => 'arrondissement_id',
                'airesanteId' => 'airesante_id',
            ];

            $input = $request->all();
            foreach ($camelToSnake as $camel => $snake) {
                if (array_key_exists($camel, $input)) {
                    $input[$snake] = $input[$camel];
                    unset($input[$camel]);
                }
            }

            // Convertir les strings "true"/"false" en vrais booléens (FormData envoie des strings)
            $boolFields = ['est_ferme', 'a_cloture', 'a_titre_foncier', 'connectee_electricite', 'fonction'];
            foreach ($boolFields as $field) {
                if (isset($input[$field])) {
                    $input[$field] = filter_var($input[$field], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ? 1 : 0;
                }
            }

            $request->merge($input);

            $validator = Validator::make($request->all(), [
                'nom' => 'sometimes|string|max:255',
                'type' => 'sometimes|string|max:100',
                'arrondissement_id' => 'nullable|integer|exists:arrondissements,id',
                'airesante_id' => 'nullable|integer|exists:airesantes,id',
                'situation' => 'nullable|string',
                'telephone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'capacite_lits' => 'nullable|integer|min:0',
                'est_ferme' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
                'cat_rec' => 'nullable|string|max:100',
                'responsable_nom' => 'nullable|string|max:200',
                'responsable_telephone' => 'nullable|string|max:20',
                'org_unit' => 'nullable|string|max:200',
                'statut_rec' => 'nullable|string|max:100',
                'a_cloture' => 'nullable|boolean',
                'a_titre_foncier' => 'nullable|boolean',
                'connectee_electricite' => 'nullable|boolean',
                'type_courant' => 'nullable|string|max:20',
                'maintenance_priority' => 'nullable|string|max:20',
                'maintenance_issues' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return $this->errorResponse('Erreur de validation', 422, $validator->errors());
            }

            $oldData = $fosa->toArray();
            $data = $validator->validated();

            // Les champs texte ne doivent pas être null si la DB ne l'accepte pas
            $textFields = ['situation', 'telephone', 'email', 'type_courant', 'org_unit',
                'responsable_nom', 'responsable_telephone', 'maintenance_issues', 'maintenance_priority',
                'nom_directeur', 'statut_rec', 'cat_rec'];
            foreach ($textFields as $field) {
                if (array_key_exists($field, $data) && $data[$field] === null) {
                    $data[$field] = '';
                }
            }

            if ($request->hasFile('image')) {
                if ($fosa->image) {
                    Storage::disk('public')->delete($fosa->image);
                }
                $data['image'] = $request->file('image')->store('fosas', 'public');
            }

            if (isset($data['latitude']) && isset($data['longitude'])) {
                $data['geom'] = DB::raw("ST_GeomFromText('POINT({$data['longitude']} {$data['latitude']})', 4326)");
            }

            // UPDATE : ne touche PAS `type` (préservé tel qu'en DB)
            // catRec modifie uniquement cat_rec, statutRec modifie uniquement statut_rec
            unset($data['type']);

            $fosa->update($data);

            $this->auditService->logUpdate($request->user(), 'fosas', $fosa->id, $oldData, $fosa->fresh()->toArray(), $request);

            return $this->successResponse($fosa->fresh(), 'FOSA mise a jour avec succes');
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la mise a jour de la FOSA: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/fosas/{id}",
     *     operationId="deleteFosa",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="Supprimer une FOSA",
     *     description="Supprime une formation sanitaire. Roles autorises: admin, super_admin.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la FOSA"),
     *     @OA\Response(
     *         response=200,
     *         description="FOSA supprimee avec succes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string")
     *         )
     *     ),
     *     @OA\Response(response=404, description="FOSA non trouvee"),
     *     @OA\Response(response=403, description="Acces refuse"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $fosa = Fosa::find($id);

            if (!$fosa) {
                return $this->errorResponse('FOSA non trouvee', 404);
            }

            $oldData = $fosa->toArray();

            if ($fosa->image) {
                Storage::disk('public')->delete($fosa->image);
            }

            $fosa->delete();

            $this->auditService->logDelete($request->user(), 'fosas', $id, $oldData, $request);

            return $this->successResponse(null, 'FOSA supprimee avec succes');
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la suppression de la FOSA: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/closed",
     *     operationId="getClosedFosas",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="FOSA fermees",
     *     description="Retourne la liste des formations sanitaires fermees.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des FOSA fermees recuperee avec succes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="pagination", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function closed(): JsonResponse
    {
        try {
            $fosas = Fosa::where('est_ferme', true)->paginate(request('per_page', 15));

            return $this->paginatedResponse($fosas, 'Liste des FOSA fermees recuperee avec succes');
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/type/{type}",
     *     operationId="getFosasByType",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="FOSA par type",
     *     description="Retourne les formations sanitaires filtrees par type.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="type", in="path", required=true, @OA\Schema(type="string"), description="Type de FOSA"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="Liste des FOSA par type recuperee avec succes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="array", @OA\Items(type="object")),
     *             @OA\Property(property="pagination", type="object")
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function byType(string $type): JsonResponse
    {
        try {
            $fosas = Fosa::where('type', $type)->paginate(request('per_page', 15));

            return $this->paginatedResponse($fosas, "Liste des FOSA de type '{$type}' recuperee avec succes");
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/map/all",
     *     operationId="getFosasMapAll",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="Toutes les FOSA pour la carte",
     *     description="Retourne toutes les FOSA avec les champs minimaux necessaires pour l'affichage cartographique (id, nom, type, latitude, longitude, est_ferme).",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Donnees cartographiques recuperees avec succes",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="array", @OA\Items(
     *                 @OA\Property(property="id", type="integer"),
     *                 @OA\Property(property="nom", type="string"),
     *                 @OA\Property(property="type", type="string"),
     *                 @OA\Property(property="latitude", type="number", format="double"),
     *                 @OA\Property(property="longitude", type="number", format="double"),
     *                 @OA\Property(property="est_ferme", type="boolean")
     *             ))
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function mapAll(): JsonResponse
    {
        try {
            $fosas = Fosa::select('id', 'nom', 'type', 'cat_rec', 'statut_rec', 'latitude', 'longitude', 'est_ferme')->get()
                ->map(function ($f) {
                    $arr = $f->toArray();
                    $arr['typeOriginal'] = $arr['type'] ?? null;
                    $arr['type'] = $f->cat_rec ?: $arr['type'];
                    $arr['categorie'] = $f->cat_rec ?: $arr['type'];
                    $arr['statutRec'] = $f->statut_rec;
                    return $arr;
                });

            return $this->successResponse($fosas, 'Donnees cartographiques recuperees avec succes');
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/map/{id}",
     *     operationId="getFosaMapById",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="FOSA unique pour la carte",
     *     description="Retourne une FOSA unique avec les champs necessaires pour l'affichage cartographique.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer"), description="ID de la FOSA"),
     *     @OA\Response(
     *         response=200,
     *         description="Donnees cartographiques de la FOSA recuperees",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="object")
     *         )
     *     ),
     *     @OA\Response(response=404, description="FOSA non trouvee"),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function mapById(int $id): JsonResponse
    {
        try {
            $fosa = Fosa::select('id', 'nom', 'type', 'cat_rec', 'statut_rec', 'latitude', 'longitude', 'est_ferme')->find($id);
            if ($fosa) {
                $arr = $fosa->toArray();
                $arr['typeOriginal'] = $arr['type'] ?? null;
                $arr['type'] = $fosa->cat_rec ?: $arr['type'];
                $arr['categorie'] = $fosa->cat_rec ?: $arr['type'];
                $arr['statutRec'] = $fosa->statut_rec;
                $fosa = $arr;
            }

            if (!$fosa) {
                return $this->errorResponse('FOSA non trouvee', 404);
            }

            return $this->successResponse($fosa, 'Donnees cartographiques de la FOSA recuperees');
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/map/airesante/{airesanteId}",
     *     operationId="getFosasMapByAiresante",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="FOSA d'une aire de sante pour la carte",
     *     description="Retourne les FOSA d'une aire de sante avec les champs necessaires pour l'affichage cartographique.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="airesanteId", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'aire de sante"),
     *     @OA\Response(
     *         response=200,
     *         description="Donnees cartographiques recuperees",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string"),
     *             @OA\Property(property="data", type="array", @OA\Items(type="object"))
     *         )
     *     ),
     *     @OA\Response(response=401, description="Non authentifie")
     * )
     */
    public function mapByAiresante(int $airesanteId): JsonResponse
    {
        try {
            $fosas = Fosa::select('id', 'nom', 'type', 'cat_rec', 'statut_rec', 'latitude', 'longitude', 'est_ferme')
                ->where('airesante_id', $airesanteId)
                ->get()
                ->map(function ($f) {
                    $arr = $f->toArray();
                    $arr['typeOriginal'] = $arr['type'] ?? null;
                    $arr['type'] = $f->cat_rec ?: $arr['type'];
                    $arr['categorie'] = $f->cat_rec ?: $arr['type'];
                    $arr['statutRec'] = $f->statut_rec;
                    return $arr;
                });

            return $this->successResponse($fosas, "Donnees cartographiques de l'aire de sante recuperees");
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/spatial/region/{regionId}",
     *     operationId="getFosasSpatialByRegion",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="FOSA dans une region (requete spatiale)",
     *     description="Retourne les FOSA situees geographiquement dans une region en utilisant une requete spatiale ST_Within sur la colonne geom.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="regionId", in="path", required=true, @OA\Schema(type="integer"), description="ID de la region"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="FOSA de la region recuperees avec succes",
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
    public function spatialByRegion(int $regionId): JsonResponse
    {
        try {
            $fosas = $this->fosaService->getSpatialByRegion($regionId);
            return $this->successResponse($fosas);
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la requete spatiale: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/spatial/departement/{departementId}",
     *     operationId="getFosasSpatialByDepartement",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="FOSA dans un departement (requete spatiale)",
     *     description="Retourne les FOSA situees geographiquement dans un departement en utilisant une requete spatiale ST_Within sur la colonne geom.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="departementId", in="path", required=true, @OA\Schema(type="integer"), description="ID du departement"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="FOSA du departement recuperees avec succes",
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
    public function spatialByDepartement(int $departementId): JsonResponse
    {
        try {
            $fosas = $this->fosaService->getSpatialByDepartement($departementId);
            return $this->successResponse($fosas);
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la requete spatiale: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/spatial/arrondissement/{arrondissementId}",
     *     operationId="getFosasSpatialByArrondissement",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="FOSA dans un arrondissement (requete spatiale)",
     *     description="Retourne les FOSA situees geographiquement dans un arrondissement en utilisant une requete spatiale ST_Within sur la colonne geom.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="arrondissementId", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'arrondissement"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="FOSA de l'arrondissement recuperees avec succes",
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
    public function spatialByArrondissement(int $arrondissementId): JsonResponse
    {
        try {
            $fosas = $this->fosaService->getSpatialByArrondissement($arrondissementId);
            return $this->successResponse($fosas);
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la requete spatiale: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/spatial/district/{districtId}",
     *     operationId="getFosasSpatialByDistrict",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="FOSA dans un district (requete spatiale)",
     *     description="Retourne les FOSA situees geographiquement dans un district de sante en utilisant une requete spatiale ST_Within sur la colonne geom.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="districtId", in="path", required=true, @OA\Schema(type="integer"), description="ID du district de sante"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="FOSA du district recuperees avec succes",
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
    public function spatialByDistrict(int $districtId): JsonResponse
    {
        try {
            $fosas = $this->fosaService->getSpatialByDistrict($districtId);
            return $this->successResponse($fosas);
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la requete spatiale: ' . $e->getMessage(), 500);
        }
    }

    /**
     * @OA\Get(
     *     path="/fosas/spatial/airesante/{airesanteId}",
     *     operationId="getFosasSpatialByAiresante",
     *     tags={"FOSA - Formations Sanitaires"},
     *     summary="FOSA dans une aire de sante (requete spatiale)",
     *     description="Retourne les FOSA situees geographiquement dans une aire de sante en utilisant une requete spatiale ST_Contains sur la colonne geom.",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="airesanteId", in="path", required=true, @OA\Schema(type="integer"), description="ID de l'aire de sante"),
     *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", default=15)),
     *     @OA\Response(
     *         response=200,
     *         description="FOSA de l'aire de sante recuperees avec succes",
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
    public function spatialByAiresante(int $airesanteId): JsonResponse
    {
        try {
            $fosas = $this->fosaService->getSpatialByAiresante($airesanteId);
            return $this->successResponse($fosas);
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de la requete spatiale: ' . $e->getMessage(), 500);
        }
    }
}
