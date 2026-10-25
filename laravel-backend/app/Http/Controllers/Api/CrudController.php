<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class CrudController extends Controller
{
    protected string $modelClass;
    protected string $resourceName;
    protected array $relations = [];
    protected array $filterFields = [];
    /**
     * Filtres passant par une relation, pour les tables qui n'ont pas la colonne.
     * Format : ['param_requete' => ['relation', 'colonne_sur_la_relation']]
     * Ex : ['fosa_id' => ['service', 'fosa_id']] → equipebio -> service -> fosa
     */
    protected array $relationFilters = [];
    protected array $validationRules = [];
    protected array $updateRules = [];

    public function __construct(protected AuditService $auditService) {}

    private function hasGeom(): bool
    {
        return method_exists($this->modelClass, 'scopeWithGeojson');
    }

    /**
     * Requête DB brute pour tables avec geom
     * include_geom=true : inclut ST_AsGeoJSON (pour la carte)
     * Par défaut : skip le geom (pour le dashboard, rapide)
     */
    private function geomDbQuery(bool $includeGeom = false)
    {
        $table = (new $this->modelClass)->getTable();
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing($table);
        $cols = collect($columns)->reject(fn ($c) => $c === 'geom')
            ->map(fn ($c) => "{$table}.{$c}")->implode(', ');

        $query = \Illuminate\Support\Facades\DB::table($table);

        if ($includeGeom) {
            $query->selectRaw("{$cols}, ST_AsGeoJSON({$table}.geom) as geom_json");
        } else {
            $query->selectRaw($cols);
        }

        return $query;
    }

    /**
     * Ajoute un alias snake_case pour chaque clé camelCase reçue du frontend
     * (ex: fosaId => fosa_id, serviceId => service_id) afin que la validation
     * et le mass-assignment (qui attendent du snake_case) fonctionnent.
     */
    protected function normalizeInput(Request $request): void
    {
        $aliases = [];
        foreach ($request->all() as $key => $value) {
            $snake = strtolower(preg_replace('/([a-z0-9])([A-Z])/', '$1_$2', $key));
            if ($snake !== $key && !$request->has($snake)) {
                $aliases[$snake] = $value;
            }
        }
        if (!empty($aliases)) {
            $request->merge($aliases);
        }
    }

    /**
     * Convertit les colonnes FK + timestamps en camelCase pour le frontend.
     */
    protected function camelizeKeys(array $item): array
    {
        $map = [
            'region_id' => 'regionId',
            'departement_id' => 'departementId',
            'arrondissement_id' => 'arrondissementId',
            'district_id' => 'districtId',
            'airesante_id' => 'airesanteId',
            'fosa_id' => 'fosaId',
            'batiment_id' => 'batimentId',
            'service_id' => 'serviceId',
            'degradation_id' => 'degradationId',
            'categorie_id' => 'categorieId',
            'commune_id' => 'communeId',
            'user_id' => 'userId',
            'anne_construction' => 'anneConstruction',
            'annee_construction' => 'anneConstruction',
            'created_at' => 'createdAt',
            'updated_at' => 'updatedAt',
        ];
        foreach ($map as $snake => $camel) {
            if (array_key_exists($snake, $item) && !array_key_exists($camel, $item)) {
                $item[$camel] = $item[$snake];
                unset($item[$snake]);
            }
        }
        return $item;
    }

    /**
     * Ne conserve que les clés correspondant à des colonnes réellement
     * présentes dans la table (protège des schémas legacy désynchronisés
     * des modèles → évite les erreurs "Unknown column ... in INSERT/UPDATE").
     */
    protected function filterExistingColumns(array $data): array
    {
        $table = (new $this->modelClass)->getTable();
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing($table);
        return array_intersect_key($data, array_flip($columns));
    }

    private function processRow($item, bool $includeGeom = false): array
    {
        $item = (array) $item;
        if ($includeGeom) {
            $item['geom'] = isset($item['geom_json']) ? json_decode($item['geom_json']) : null;
            unset($item['geom_json']);
        }
        return $this->camelizeKeys($item);
    }

    public function index(Request $request): JsonResponse
    {
        $this->normalizeInput($request);

        if ($this->hasGeom()) {
            $includeGeom = $request->boolean('include_geom', false);
            $query = $this->geomDbQuery($includeGeom);

            foreach ($this->filterFields as $field) {
                if ($request->filled($field)) {
                    $query->where($field, $request->input($field));
                }
            }

            $geoFilters = $request->attributes->get('geographic_filters', []);
            foreach ($geoFilters as $column => $value) {
                $query->where($column, $value);
            }

            // Sans limit: tout retourner (comme l'ancien backend Node)
            if (!$request->filled('limit') && !$request->filled('per_page')) {
                $rows = $query->get();
                $items = $rows->map(fn ($r) => $this->processRow($r, $includeGeom));
                return response()->json([
                    'success' => true,
                    'data' => $items->values(),
                    'pagination' => ['page' => 1, 'total' => $items->count(), 'totalPages' => 1],
                ]);
            }

            $perPage = (int) ($request->input('per_page') ?? $request->input('limit', 15));
            $data = $query->paginate(max($perPage, 1));
            $items = collect($data->items())->map(fn ($r) => $this->processRow($r, $includeGeom));

            return response()->json([
                'success' => true,
                'data' => $items->values(),
                'pagination' => ['page' => $data->currentPage(), 'total' => $data->total(), 'totalPages' => $data->lastPage()],
            ]);
        }

        // Sans geom: Eloquent normal
        $query = $this->modelClass::query();

        if (!empty($this->relations)) {
            $query->with($this->relations);
        }

        // Filtres directs : seulement si la colonne existe réellement (schéma legacy)
        $existingColumns = \Illuminate\Support\Facades\Schema::getColumnListing(
            (new $this->modelClass)->getTable()
        );
        foreach ($this->filterFields as $field) {
            if ($request->filled($field) && in_array($field, $existingColumns, true)) {
                $query->where($field, $request->input($field));
            }
        }

        // Filtres via une relation (ex: fosa_id sur equipebios -> service.fosa_id)
        foreach ($this->relationFilters as $param => [$relation, $column]) {
            if ($request->filled($param)) {
                $value = $request->input($param);
                $query->whereHas($relation, fn ($q) => $q->where($column, $value));
            }
        }

        $geoFilters = $request->attributes->get('geographic_filters', []);
        foreach ($geoFilters as $column => $value) {
            $query->where($column, $value);
        }

        // Si pas de limit/per_page: tout retourner (comme l'ancien backend Node)
        if (!$request->filled('limit') && !$request->filled('per_page')) {
            $rows = $query->get();
            return response()->json([
                'success' => true,
                'data' => $rows->map(fn ($m) => $this->camelizeKeys($m->toArray()))->values(),
                'pagination' => ['page' => 1, 'total' => $rows->count(), 'totalPages' => 1],
            ]);
        }

        $perPage = (int) ($request->input('per_page') ?? $request->input('limit', 15));
        $perPage = max($perPage, 1);

        $data = $query->paginate($perPage);
        return response()->json([
            'success' => true,
            'data' => collect($data->items())->map(fn ($m) => $this->camelizeKeys($m->toArray()))->values(),
            'pagination' => ['page' => $data->currentPage(), 'total' => $data->total(), 'totalPages' => $data->lastPage()],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        if ($this->hasGeom()) {
            $item = $this->geomDbQuery(true)->where('id', $id)->first();
            if (!$item) return $this->errorResponse("{$this->resourceName} non trouvé(e)", 404);

            return response()->json([
                'success' => true,
                'data' => $this->processRow($item, true),
            ]);
        }

        // Sans geom: Eloquent normal
        $query = $this->modelClass::query();
        if (!empty($this->relations)) $query->with($this->relations);

        $item = $query->find($id);
        if (!$item) return $this->errorResponse("{$this->resourceName} non trouvé(e)", 404);

        return $this->successResponse($this->camelizeKeys($item->toArray()));
    }

    public function store(Request $request): JsonResponse
    {
        $this->normalizeInput($request);

        if (!empty($this->validationRules)) {
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), $this->validationRules);
            if ($validator->fails()) {
                return $this->errorResponse('Erreur de validation', 422, $validator->errors());
            }
            $data = $validator->validated();
        } else {
            $data = $request->all();
        }

        $data = $this->filterExistingColumns($data);
        $item = $this->modelClass::create($data);
        $this->auditService->logCreate($request->user(), $this->resourceName, $item->id, $item->toArray(), $request);
        return $this->successResponse($item, "{$this->resourceName} créé(e) avec succès", 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->normalizeInput($request);

        $item = $this->modelClass::find($id);
        if (!$item) return $this->errorResponse("{$this->resourceName} non trouvé(e)", 404);

        $rules = !empty($this->updateRules) ? $this->updateRules : $this->validationRules;
        if (!empty($rules)) {
            // Make all rules nullable for updates
            $updateRules = array_map(function ($rule) {
                $ruleStr = is_array($rule) ? implode('|', $rule) : $rule;
                return str_replace('required', 'sometimes', $ruleStr);
            }, $rules);

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), $updateRules);
            if ($validator->fails()) {
                return $this->errorResponse('Erreur de validation', 422, $validator->errors());
            }
            $data = $validator->validated();
        } else {
            $data = $request->all();
        }

        $data = $this->filterExistingColumns($data);
        $old = $item->toArray();
        $item->update($data);
        $item->refresh();
        $this->auditService->logUpdate($request->user(), $this->resourceName, $id, $old, $item->toArray(), $request);

        return $this->successResponse($item, "{$this->resourceName} mis(e) à jour");
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $item = $this->modelClass::find($id);
        if (!$item) return $this->errorResponse("{$this->resourceName} non trouvé(e)", 404);

        $this->auditService->logDelete($request->user(), $this->resourceName, $id, $item->toArray(), $request);
        $item->delete();

        return $this->successResponse(null, "{$this->resourceName} supprimé(e)");
    }
}
