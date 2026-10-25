<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class MapService
{
    /**
     * Regions with full hierarchy: Region -> Districts -> Airesantes -> Fosas
     */
    public function getAllRegionsForMap(?int $limit = null, ?int $offset = null): array
    {
        $sql = "SELECT
            r.id as region_id, r.nom as region_nom, ST_AsGeoJSON(r.geom) as region_geojson,
            d.id as district_id, d.nom_ds as district_nom, d.code_ds as district_code, ST_AsGeoJSON(d.geom) as district_geojson,
            a.id as airesante_id, a.nom_as as airesante_nom, a.code_as as airesante_code, ST_AsGeoJSON(a.geom) as airesante_geojson,
            f.id as fosa_id, f.nom as fosa_nom, f.type as fosa_type, f.latitude, f.longitude, f.est_ferme, f.situation
        FROM regions r
        LEFT JOIN districts d ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
        LEFT JOIN airesantes a ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
        LEFT JOIN tmpfosa f ON f.airesante_id = a.id
        ORDER BY r.id, d.id, a.id, f.id";

        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET " . ($offset ?? 0);
        }

        $rows = DB::select($sql);
        return $this->buildRegionHierarchy($rows);
    }

    public function getRegionByIdForMap(int $regionId): ?array
    {
        $rows = DB::select("SELECT
            r.id as region_id, r.nom as region_nom, ST_AsGeoJSON(r.geom) as region_geojson,
            d.id as district_id, d.nom_ds as district_nom, d.code_ds as district_code, ST_AsGeoJSON(d.geom) as district_geojson,
            a.id as airesante_id, a.nom_as as airesante_nom, a.code_as as airesante_code, ST_AsGeoJSON(a.geom) as airesante_geojson,
            f.id as fosa_id, f.nom as fosa_nom, f.type as fosa_type, f.latitude, f.longitude, f.est_ferme, f.situation
        FROM regions r
        LEFT JOIN districts d ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
        LEFT JOIN airesantes a ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
        LEFT JOIN tmpfosa f ON f.airesante_id = a.id
        WHERE r.id = ?
        ORDER BY d.id, a.id, f.id", [$regionId]);

        $result = $this->buildRegionHierarchy($rows);
        return $result[0] ?? null;
    }

    /**
     * Districts with hierarchy: District -> Region + Airesantes -> Fosas
     */
    public function getAllDistrictsForMap(?int $limit = null, ?int $offset = null): array
    {
        $sql = "SELECT
            d.id as district_id, d.nom_ds as district_nom, d.code_ds as district_code, d.region as district_region, ST_AsGeoJSON(d.geom) as district_geojson,
            r.id as region_id, r.nom as region_nom, ST_AsGeoJSON(r.geom) as region_geojson,
            a.id as airesante_id, a.nom_as as airesante_nom, a.code_as as airesante_code, ST_AsGeoJSON(a.geom) as airesante_geojson,
            f.id as fosa_id, f.nom as fosa_nom, f.type as fosa_type, f.latitude, f.longitude, f.est_ferme, f.situation
        FROM districts d
        INNER JOIN regions r ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
        LEFT JOIN airesantes a ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
        LEFT JOIN tmpfosa f ON f.airesante_id = a.id
        ORDER BY d.id, a.id, f.id";

        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET " . ($offset ?? 0);
        }

        $rows = DB::select($sql);
        return $this->buildDistrictHierarchy($rows);
    }

    public function getDistrictByIdForMap(int $districtId): ?array
    {
        $rows = DB::select("SELECT
            d.id as district_id, d.nom_ds as district_nom, d.code_ds as district_code, d.region as district_region, ST_AsGeoJSON(d.geom) as district_geojson,
            r.id as region_id, r.nom as region_nom, ST_AsGeoJSON(r.geom) as region_geojson,
            a.id as airesante_id, a.nom_as as airesante_nom, a.code_as as airesante_code, ST_AsGeoJSON(a.geom) as airesante_geojson,
            f.id as fosa_id, f.nom as fosa_nom, f.type as fosa_type, f.latitude, f.longitude, f.est_ferme, f.situation
        FROM districts d
        INNER JOIN regions r ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
        LEFT JOIN airesantes a ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
        LEFT JOIN tmpfosa f ON f.airesante_id = a.id
        WHERE d.id = ?
        ORDER BY a.id, f.id", [$districtId]);

        $result = $this->buildDistrictHierarchy($rows);
        return $result[0] ?? null;
    }

    public function getDistrictsByRegionForMap(int $regionId): array
    {
        $rows = DB::select("SELECT
            d.id as district_id, d.nom_ds as district_nom, d.code_ds as district_code, d.region as district_region, ST_AsGeoJSON(d.geom) as district_geojson,
            r.id as region_id, r.nom as region_nom, ST_AsGeoJSON(r.geom) as region_geojson,
            a.id as airesante_id, a.nom_as as airesante_nom, a.code_as as airesante_code, ST_AsGeoJSON(a.geom) as airesante_geojson,
            f.id as fosa_id, f.nom as fosa_nom, f.type as fosa_type, f.latitude, f.longitude, f.est_ferme, f.situation
        FROM districts d
        INNER JOIN regions r ON (ST_Contains(r.geom, d.geom) OR d.region_id = r.id) AND r.id = ?
        LEFT JOIN airesantes a ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
        LEFT JOIN tmpfosa f ON f.airesante_id = a.id
        ORDER BY d.id, a.id, f.id", [$regionId]);

        return $this->buildDistrictHierarchy($rows);
    }

    /**
     * Airesantes with hierarchy: Airesante -> District -> Region + Fosas
     */
    public function getAllAiresantesForMap(?int $limit = null, ?int $offset = null): array
    {
        $sql = "SELECT
            a.id as airesante_id, a.nom_as as airesante_nom, a.nom_dist as airesante_nom_dist,
            a.code_as as airesante_code, a.area as airesante_area, ST_AsGeoJSON(a.geom) as airesante_geojson,
            d.id as district_id, d.nom_ds as district_nom, d.code_ds as district_code, d.region as district_region, ST_AsGeoJSON(d.geom) as district_geojson,
            r.id as region_id, r.nom as region_nom, ST_AsGeoJSON(r.geom) as region_geojson,
            f.id as fosa_id, f.nom as fosa_nom, f.type as fosa_type, f.latitude, f.longitude, f.est_ferme, f.situation
        FROM airesantes a
        INNER JOIN districts d ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
        LEFT JOIN regions r ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
        LEFT JOIN tmpfosa f ON f.airesante_id = a.id
        ORDER BY a.id, f.id";

        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET " . ($offset ?? 0);
        }

        $rows = DB::select($sql);
        return $this->buildAiresanteHierarchy($rows);
    }

    public function getAiresanteByIdForMap(int $airesanteId): ?array
    {
        $rows = DB::select("SELECT
            a.id as airesante_id, a.nom_as as airesante_nom, a.nom_dist as airesante_nom_dist,
            a.code_as as airesante_code, a.area as airesante_area, ST_AsGeoJSON(a.geom) as airesante_geojson,
            d.id as district_id, d.nom_ds as district_nom, d.code_ds as district_code, d.region as district_region, ST_AsGeoJSON(d.geom) as district_geojson,
            r.id as region_id, r.nom as region_nom, ST_AsGeoJSON(r.geom) as region_geojson,
            f.id as fosa_id, f.nom as fosa_nom, f.type as fosa_type, f.latitude, f.longitude, f.est_ferme, f.situation
        FROM airesantes a
        INNER JOIN districts d ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
        LEFT JOIN regions r ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
        LEFT JOIN tmpfosa f ON f.airesante_id = a.id
        WHERE a.id = ?
        ORDER BY f.id", [$airesanteId]);

        $result = $this->buildAiresanteHierarchy($rows);
        return $result[0] ?? null;
    }

    public function getAiresantesByDistrictForMap(int $districtId): array
    {
        $rows = DB::select("SELECT
            a.id as airesante_id, a.nom_as as airesante_nom, a.nom_dist as airesante_nom_dist,
            a.code_as as airesante_code, a.area as airesante_area, ST_AsGeoJSON(a.geom) as airesante_geojson,
            d.id as district_id, d.nom_ds as district_nom, d.code_ds as district_code, d.region as district_region, ST_AsGeoJSON(d.geom) as district_geojson,
            f.id as fosa_id, f.nom as fosa_nom, f.type as fosa_type, f.latitude, f.longitude, f.est_ferme, f.situation
        FROM airesantes a
        INNER JOIN districts d ON (ST_Contains(d.geom, a.geom) OR a.district_id = d.id) AND d.id = ?
        LEFT JOIN tmpfosa f ON f.airesante_id = a.id
        ORDER BY a.id, f.id", [$districtId]);

        return $this->buildAiresanteHierarchy($rows);
    }

    // ── Hierarchy builders ──

    private function buildRegionHierarchy(array $rows): array
    {
        $regions = [];
        foreach ($rows as $row) {
            $rid = $row->region_id;
            if (!isset($regions[$rid])) {
                $regions[$rid] = [
                    'id' => $rid, 'nom' => $row->region_nom,
                    'geojson' => $row->region_geojson ? json_decode($row->region_geojson) : null,
                    'districts' => [],
                ];
            }
            if ($row->district_id && !isset($regions[$rid]['districts'][$row->district_id])) {
                $regions[$rid]['districts'][$row->district_id] = [
                    'id' => $row->district_id, 'nom' => $row->district_nom, 'code' => $row->district_code,
                    'geojson' => $row->district_geojson ? json_decode($row->district_geojson) : null,
                    'airesantes' => [],
                ];
            }
            if ($row->airesante_id && $row->district_id && !isset($regions[$rid]['districts'][$row->district_id]['airesantes'][$row->airesante_id])) {
                $regions[$rid]['districts'][$row->district_id]['airesantes'][$row->airesante_id] = [
                    'id' => $row->airesante_id, 'nom' => $row->airesante_nom, 'code' => $row->airesante_code,
                    'geojson' => $row->airesante_geojson ? json_decode($row->airesante_geojson) : null,
                    'fosas' => [],
                ];
            }
            if ($row->fosa_id && $row->airesante_id && $row->district_id) {
                $regions[$rid]['districts'][$row->district_id]['airesantes'][$row->airesante_id]['fosas'][] = [
                    'id' => $row->fosa_id, 'nom' => $row->fosa_nom, 'type' => $row->fosa_type,
                    'latitude' => $row->latitude, 'longitude' => $row->longitude,
                    'estFerme' => (bool) $row->est_ferme, 'situation' => $row->situation,
                ];
            }
        }
        // Convert associative arrays to indexed
        foreach ($regions as &$r) {
            foreach ($r['districts'] as &$d) {
                $d['airesantes'] = array_values($d['airesantes']);
            }
            $r['districts'] = array_values($r['districts']);
        }
        return array_values($regions);
    }

    private function buildDistrictHierarchy(array $rows): array
    {
        $districts = [];
        foreach ($rows as $row) {
            $did = $row->district_id;
            if (!isset($districts[$did])) {
                $districts[$did] = [
                    'id' => $did, 'nom' => $row->district_nom, 'code' => $row->district_code,
                    'region' => $row->district_region ?? null,
                    'geojson' => $row->district_geojson ? json_decode($row->district_geojson) : null,
                    'regionData' => [
                        'id' => $row->region_id, 'nom' => $row->region_nom,
                        'geojson' => $row->region_geojson ? json_decode($row->region_geojson) : null,
                    ],
                    'airesantes' => [],
                ];
            }
            if ($row->airesante_id && !isset($districts[$did]['airesantes'][$row->airesante_id])) {
                $districts[$did]['airesantes'][$row->airesante_id] = [
                    'id' => $row->airesante_id, 'nom' => $row->airesante_nom, 'code' => $row->airesante_code,
                    'geojson' => $row->airesante_geojson ? json_decode($row->airesante_geojson) : null,
                    'fosas' => [],
                ];
            }
            if ($row->fosa_id && $row->airesante_id) {
                $districts[$did]['airesantes'][$row->airesante_id]['fosas'][] = [
                    'id' => $row->fosa_id, 'nom' => $row->fosa_nom, 'type' => $row->fosa_type,
                    'latitude' => $row->latitude, 'longitude' => $row->longitude,
                    'estFerme' => (bool) $row->est_ferme, 'situation' => $row->situation,
                ];
            }
        }
        foreach ($districts as &$d) {
            $d['airesantes'] = array_values($d['airesantes']);
        }
        return array_values($districts);
    }

    private function buildAiresanteHierarchy(array $rows): array
    {
        $airesantes = [];
        foreach ($rows as $row) {
            $aid = $row->airesante_id;
            if (!isset($airesantes[$aid])) {
                $airesantes[$aid] = [
                    'id' => $aid, 'nom' => $row->airesante_nom,
                    'nomDist' => $row->airesante_nom_dist ?? null,
                    'code' => $row->airesante_code, 'area' => $row->airesante_area ?? null,
                    'geojson' => $row->airesante_geojson ? json_decode($row->airesante_geojson) : null,
                    'district' => [
                        'id' => $row->district_id, 'nom' => $row->district_nom,
                        'code' => $row->district_code, 'region' => $row->district_region ?? null,
                        'geojson' => $row->district_geojson ? json_decode($row->district_geojson) : null,
                        'regionData' => property_exists($row, 'region_id') ? [
                            'id' => $row->region_id, 'nom' => $row->region_nom,
                            'geojson' => $row->region_geojson ? json_decode($row->region_geojson) : null,
                        ] : null,
                    ],
                    'fosas' => [],
                ];
            }
            if ($row->fosa_id) {
                $airesantes[$aid]['fosas'][] = [
                    'id' => $row->fosa_id, 'nom' => $row->fosa_nom, 'type' => $row->fosa_type,
                    'latitude' => $row->latitude, 'longitude' => $row->longitude,
                    'estFerme' => (bool) $row->est_ferme, 'situation' => $row->situation,
                ];
            }
        }
        return array_values($airesantes);
    }
}
