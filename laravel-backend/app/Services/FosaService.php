<?php

namespace App\Services;

use App\Models\Fosa;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class FosaService
{
    public function getPaginated(array $filters = [], int $perPage = 15)
    {
        $query = Fosa::query();

        if (!empty($filters['type'])) $query->where('type', $filters['type']);
        if (!empty($filters['arrondissement_id'])) $query->where('arrondissement_id', $filters['arrondissement_id']);
        if (!empty($filters['airesante_id'])) $query->where('airesante_id', $filters['airesante_id']);
        if (isset($filters['est_ferme'])) $query->where('est_ferme', $filters['est_ferme']);

        $this->applyGeographicFilters($query, $filters['geographic'] ?? []);

        return $query->with(['arrondissement', 'airesante'])->orderBy('nom')->paginate($perPage);
    }

    public function getById(int $id)
    {
        return Fosa::query()->with([
            'arrondissement.departement.region', 'airesante.district',
            'batiments.degradation', 'services', 'personnels.categorie',
            'equipements', 'equipebios', 'materielroulants',
        ])->findOrFail($id);
    }

    public function create(array $data): Fosa
    {
        if (isset($data['latitude']) && isset($data['longitude'])) {
            $data['geom'] = DB::raw("ST_GeomFromText('POINT({$data['longitude']} {$data['latitude']})', 4326)");
        }
        return Fosa::create($data);
    }

    public function update(int $id, array $data): Fosa
    {
        $fosa = Fosa::findOrFail($id);
        if (isset($data['latitude']) && isset($data['longitude'])) {
            $data['geom'] = DB::raw("ST_GeomFromText('POINT({$data['longitude']} {$data['latitude']})', 4326)");
        }
        $fosa->update($data);
        return $fosa->fresh();
    }

    public function delete(int $id): bool
    {
        return Fosa::findOrFail($id)->delete();
    }

    public function getClosedFosas(int $perPage = 15)
    {
        return Fosa::query()->closed()->with(['arrondissement', 'airesante'])->paginate($perPage);
    }

    public function getByType(string $type, int $perPage = 15)
    {
        return Fosa::query()->byType($type)->with(['arrondissement', 'airesante'])->paginate($perPage);
    }

    public function getForMap()
    {
        return Fosa::select('id', 'nom', 'type', 'latitude', 'longitude', 'est_ferme')->get();
    }

    public function getMapById(int $id)
    {
        return Fosa::select('id', 'nom', 'type', 'latitude', 'longitude', 'est_ferme', 'capacite_lits', 'telephone')->findOrFail($id);
    }

    public function getMapByAiresante(int $airesanteId)
    {
        return Fosa::select('id', 'nom', 'type', 'latitude', 'longitude', 'est_ferme')
            ->where('airesante_id', $airesanteId)->get();
    }

    /**
     * Requête spatiale brute avec jointures ST_Within (comme le backend Node)
     */
    private function executeSpatialQuery(string $joinClause, array $params = []): array
    {
        $sql = "SELECT
            f.id, f.nom, f.type, f.latitude, f.longitude, f.est_ferme, f.situation,
            f.capacite_lits, f.fonction, f.statut_rec, f.cat_rec,
            f.a_cloture, f.a_titre_foncier, f.connectee_electricite, f.image,
            f.telephone, f.responsable_nom, f.responsable_telephone,
            arr.id as arrondissement_id, arr.nom as arrondissement_nom,
            ai.id as airesante_id, ai.nom_as as airesante_nom,
            d.id as district_id, d.nom_ds as district_nom, d.code_ds as district_code
        FROM tmpfosa f
        LEFT JOIN arrondissements arr ON ST_Within(f.geom, arr.geom)
        LEFT JOIN airesantes ai ON f.airesante_id = ai.id
        LEFT JOIN districts d ON ai.district_id = d.id
        {$joinClause}
        ORDER BY f.nom";

        $rows = DB::select($sql, $params);

        // Dédoublonner par FOSA id (garder la première occurrence)
        $uniqueRows = [];
        foreach ($rows as $row) {
            if (!isset($uniqueRows[$row->id])) {
                $uniqueRows[$row->id] = $row;
            }
        }
        $rows = array_values($uniqueRows);

        return array_map(function ($row) {
            return [
                'id' => $row->id,
                'nom' => $row->nom,
                // 'type' retourne cat_rec (HD, CMA, CSI, SSD, EF...) pour le filtrage et la coloration
                'type' => $row->cat_rec ?: $row->type,
                'categorie' => $row->cat_rec ?: $row->type,
                'catRec' => $row->cat_rec ?: $row->type,
                'statutRec' => $row->statut_rec ?? null,
                'typeOriginal' => $row->type,
                'latitude' => $row->latitude,
                'longitude' => $row->longitude,
                'estFerme' => (int) $row->est_ferme,
                'situation' => $row->situation ?? '',
                'capaciteLits' => (int) $row->capacite_lits,
                'fonction' => (int) $row->fonction,
                'aCloture' => (int) $row->a_cloture,
                'aTitreFoncier' => (int) $row->a_titre_foncier,
                'connecteeElectricite' => (int) $row->connectee_electricite,
                'image' => $row->image ?? null,
                'telephone' => $row->telephone ?? '',
                'responsableNom' => $row->responsable_nom ?? '',
                'responsableTelephone' => $row->responsable_telephone ?? '',
                'arrondissement' => $row->arrondissement_id ? [
                    'id' => $row->arrondissement_id,
                    'nom' => $row->arrondissement_nom,
                ] : null,
                'airesante' => $row->airesante_id ? [
                    'id' => $row->airesante_id,
                    'nom' => $row->airesante_nom,
                ] : null,
                'district' => $row->district_id ? [
                    'id' => $row->district_id,
                    'nom' => $row->district_nom,
                    'code' => $row->district_code,
                ] : null,
            ];
        }, $rows);
    }

    public function getSpatialByRegion(int $regionId)
    {
        return $this->executeSpatialQuery(
            'WHERE ST_Within(f.geom, (SELECT geom FROM regions WHERE id = ?))',
            [$regionId]
        );
    }

    public function getSpatialByDepartement(int $departementId)
    {
        return $this->executeSpatialQuery(
            'WHERE ST_Within(f.geom, (SELECT geom FROM departements WHERE id = ?))',
            [$departementId]
        );
    }

    public function getSpatialByArrondissement(int $arrondissementId)
    {
        return $this->executeSpatialQuery(
            'INNER JOIN arrondissements arr2 ON arr2.id = ? AND ST_Within(f.geom, arr2.geom)',
            [$arrondissementId]
        );
    }

    public function getSpatialByDistrict(int $districtId)
    {
        return $this->executeSpatialQuery(
            'WHERE ST_Within(f.geom, (SELECT geom FROM districts WHERE id = ?))',
            [$districtId]
        );
    }

    public function getSpatialByAiresante(int $airesanteId)
    {
        return $this->executeSpatialQuery(
            'WHERE ST_Within(f.geom, (SELECT geom FROM airesantes WHERE id = ?))',
            [$airesanteId]
        );
    }

    protected function applyGeographicFilters(Builder $query, array $filters): void
    {
        if (!empty($filters['region_id'])) {
            $query->whereHas('arrondissement.departement', fn ($q) => $q->where('region_id', $filters['region_id']));
        }
        if (!empty($filters['departement_id'])) {
            $query->whereHas('arrondissement', fn ($q) => $q->where('departement_id', $filters['departement_id']));
        }
        if (!empty($filters['arrondissement_id'])) {
            $query->where('arrondissement_id', $filters['arrondissement_id']);
        }
    }
}
