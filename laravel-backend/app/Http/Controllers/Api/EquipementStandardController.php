<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EquipementStandard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Catalogue d'équipements standard par catégorie de FOSA (lecture seule).
 * Données de référence issues des documents LISTE STANDARD du MINSANTÉ.
 */
class EquipementStandardController extends Controller
{
    /**
     * Liste du catalogue, filtrable par catégorie (?categorie=HR|HD|CMA|CSI)
     * et recherche (?search=...). Retourne tout si pas de pagination demandée.
     */
    public function index(Request $request): JsonResponse
    {
        $query = EquipementStandard::query()
            ->select('id', 'categorie_fosa', 'service', 'code', 'designation', 'specifications', 'quantite_standard', 'prix_unitaire');

        if ($request->filled('categorie')) {
            $query->where('categorie_fosa', strtoupper($request->input('categorie')));
        }
        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where('designation', 'like', "%{$s}%");
        }

        $query->orderBy('categorie_fosa')->orderBy('service')->orderBy('designation');

        $rows = $query->get()->map(fn ($r) => [
            'id' => $r->id,
            'categorieFosa' => $r->categorie_fosa,
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
