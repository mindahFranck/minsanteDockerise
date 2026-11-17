<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EquipementStandard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Catalogue d'équipements standard par catégorie de FOSA.
 * Lecture publique (index/categories) ; CRUD protégé (store/update/destroy).
 * Données de référence issues des documents LISTE STANDARD du MINSANTÉ.
 */
class EquipementStandardController extends Controller
{
    /** Règles de validation d'un équipement standard. */
    private array $rules = [
        'categorie_fosa' => 'required|string|in:HR,HD,CMA,CSI',
        'famille' => 'nullable|string|in:bio,autre',
        'service' => 'nullable|string|max:150',
        'code' => 'nullable|string|max:50',
        'designation' => 'required|string|max:500',
        'specifications' => 'nullable|string',
        'quantite_standard' => 'nullable|string|max:50',
        'prix_unitaire' => 'nullable|string|max:50',
    ];

    /** Convertit le camelCase du frontend en snake_case de la table. */
    private function normalize(Request $request): void
    {
        $map = [
            'categorieFosa' => 'categorie_fosa',
            'quantiteStandard' => 'quantite_standard',
            'prixUnitaire' => 'prix_unitaire',
        ];
        $aliases = [];
        foreach ($map as $camel => $snake) {
            if ($request->has($camel) && ! $request->has($snake)) {
                $aliases[$snake] = $request->input($camel);
            }
        }
        if (! empty($aliases)) {
            $request->merge($aliases);
        }
    }

    /** Représentation camelCase d'une ligne (identique à index). */
    private function present(EquipementStandard $r): array
    {
        return [
            'id' => $r->id,
            'categorieFosa' => $r->categorie_fosa,
            'famille' => $r->famille ?? 'bio',
            'service' => $r->service,
            'code' => $r->code,
            'designation' => $r->designation,
            'specifications' => $r->specifications,
            'quantiteStandard' => $r->quantite_standard,
            'prixUnitaire' => $r->prix_unitaire,
        ];
    }

    public function show(int $id): JsonResponse
    {
        $item = EquipementStandard::find($id);
        if (! $item) {
            return $this->errorResponse('Équipement standard non trouvé', 404);
        }

        return $this->successResponse($this->present($item));
    }

    public function store(Request $request): JsonResponse
    {
        $this->normalize($request);
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), $this->rules);
        if ($validator->fails()) {
            return $this->errorResponse('Erreur de validation', 422, $validator->errors());
        }
        $data = $validator->validated();
        $data['famille'] = $data['famille'] ?? EquipementStandard::familleFromService($data['service'] ?? null);

        $item = EquipementStandard::create($data);

        return $this->successResponse($this->present($item), 'Équipement standard créé', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = EquipementStandard::find($id);
        if (! $item) {
            return $this->errorResponse('Équipement standard non trouvé', 404);
        }
        $this->normalize($request);
        $rules = array_map(fn ($r) => str_replace('required', 'sometimes', $r), $this->rules);
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return $this->errorResponse('Erreur de validation', 422, $validator->errors());
        }
        $item->update($validator->validated());

        return $this->successResponse($this->present($item->fresh()), 'Équipement standard mis à jour');
    }

    public function destroy(int $id): JsonResponse
    {
        $item = EquipementStandard::find($id);
        if (! $item) {
            return $this->errorResponse('Équipement standard non trouvé', 404);
        }
        $item->delete();

        return $this->successResponse(null, 'Équipement standard supprimé');
    }

    /**
     * Liste du catalogue, filtrable par catégorie (?categorie=HR|HD|CMA|CSI)
     * et recherche (?search=...). Retourne tout si pas de pagination demandée.
     */
    public function index(Request $request): JsonResponse
    {
        $query = EquipementStandard::query()
            ->select('id', 'categorie_fosa', 'famille', 'service', 'code', 'designation', 'specifications', 'quantite_standard', 'prix_unitaire');

        if ($request->filled('categorie')) {
            $query->where('categorie_fosa', strtoupper($request->input('categorie')));
        }
        // Famille : bio (biomédical) ou autre (non biomédical)
        if ($request->filled('famille') && \Illuminate\Support\Facades\Schema::hasColumn('equipements_standard', 'famille')) {
            $query->where('famille', strtolower($request->input('famille')));
        }
        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where('designation', 'like', "%{$s}%");
        }

        $query->orderBy('categorie_fosa')->orderBy('service')->orderBy('designation');

        $rows = $query->get()->map(fn ($r) => [
            'id' => $r->id,
            'categorieFosa' => $r->categorie_fosa,
            'famille' => $r->famille ?? 'bio',
            'service' => $r->service,
            'code' => $r->code,
            'designation' => $r->designation,
            'specifications' => $r->specifications,
            'quantiteStandard' => $r->quantite_standard,
            'prixUnitaire' => $r->prix_unitaire,
        ]);

        return response()->json([
            'success' => true,
            'data' => $rows->values(),
            'count' => $rows->count(),
        ]);
    }

    /** Catégories disponibles avec le nombre d'équipements. */
    public function categories(): JsonResponse
    {
        $labels = [
            'HR' => 'Hôpital Régional',
            'HD' => 'Hôpital de District',
            'CMA' => "Centre Médical d'Arrondissement",
            'CSI' => 'Centre de Santé Intégré',
        ];
        $counts = EquipementStandard::selectRaw('categorie_fosa, COUNT(*) as total')
            ->groupBy('categorie_fosa')->pluck('total', 'categorie_fosa');

        $data = [];
        foreach ($labels as $code => $label) {
            $data[] = ['code' => $code, 'label' => $label, 'total' => (int) ($counts[$code] ?? 0)];
        }

        return response()->json(['success' => true, 'data' => $data]);
    }
}
