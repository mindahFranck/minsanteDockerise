<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Données de la carte publique, calculées à partir de la base (lecture seule) :
 * fiche détaillée d'une FOSA et indicateurs de l'analyse thématique.
 *
 * Le rattachement administratif des FOSA (arrondissement_id, airesante_id) est
 * vide pour la quasi-totalité des lignes du dump : comme la carte, on rattache
 * chaque FOSA à ses entités par la géométrie (ST_Within), puis par les clés
 * étrangères à défaut.
 */
class MapInsightsService
{
    /** Niveaux géographiques de l'analyse thématique. */
    public const LEVELS = ['region', 'departement', 'arrondissement', 'district', 'airesante'];

    /** Paramètre parent obligatoire par niveau (borne le coût de la jointure spatiale). */
    public const PARENTS = [
        'region' => null,
        'departement' => 'region_id',
        'arrondissement' => 'departement_id',
        'district' => 'region_id',
        'airesante' => 'district_id',
    ];

    private const CACHE_TTL = 1800;

    /* ------------------------------------------------------------------ */
    /* Analyse thématique                                                  */
    /* ------------------------------------------------------------------ */

    /**
     * Indicateurs par entité géographique : nombre de FOSA, titres fonciers,
     * clôtures, électrification, ouvertures. Les trois états (oui / non / non
     * renseigné) sont comptés séparément : aucune valeur n'est supposée.
     */
    public function thematic(string $level, ?int $parentId = null): array
    {
        $key = "map.thematic.v2.{$level}." . ($parentId ?? 'all');

        return Cache::remember($key, self::CACHE_TTL, function () use ($level, $parentId) {
            [$entitySql, $params] = $this->entitySelection($level, $parentId);

            $rows = DB::select("SELECT e.id, e.label,
                    COUNT(f.id) AS total,
                    SUM(CASE WHEN f.est_ferme = 0 THEN 1 ELSE 0 END) AS ouvertes,
                    SUM(CASE WHEN f.a_titre_foncier = 1 THEN 1 ELSE 0 END) AS tf_oui,
                    SUM(CASE WHEN f.a_titre_foncier = 0 THEN 1 ELSE 0 END) AS tf_non,
                    SUM(CASE WHEN f.id IS NOT NULL AND f.a_titre_foncier IS NULL THEN 1 ELSE 0 END) AS tf_nr,
                    SUM(CASE WHEN f.a_cloture = 1 THEN 1 ELSE 0 END) AS cl_oui,
                    SUM(CASE WHEN f.a_cloture = 0 THEN 1 ELSE 0 END) AS cl_non,
                    SUM(CASE WHEN f.id IS NOT NULL AND f.a_cloture IS NULL THEN 1 ELSE 0 END) AS cl_nr,
                    SUM(CASE WHEN f.connectee_electricite = 1 THEN 1 ELSE 0 END) AS el_oui,
                    SUM(CASE WHEN f.connectee_electricite = 0 THEN 1 ELSE 0 END) AS el_non,
                    SUM(CASE WHEN f.id IS NOT NULL AND f.connectee_electricite IS NULL THEN 1 ELSE 0 END) AS el_nr
                FROM ({$entitySql}) e
                LEFT JOIN tmpfosa f ON f.geom IS NOT NULL AND ST_Within(f.geom, e.geom)
                GROUP BY e.id, e.label
                ORDER BY e.label", $params);

            $entities = array_map(function ($row) {
                $total = (int) $row->total;
                $indicator = fn ($oui, $non, $nr) => [
                    'oui' => (int) $oui,
                    'non' => (int) $non,
                    'nonRenseigne' => (int) $nr,
                    'taux' => $total > 0 ? round(((int) $oui) * 100 / $total, 1) : null,
                ];

                return [
                    'id' => (int) $row->id,
                    'nom' => $row->label,
                    'total' => $total,
                    'ouvertes' => (int) $row->ouvertes,
                    'titreFoncier' => $indicator($row->tf_oui, $row->tf_non, $row->tf_nr),
                    'cloture' => $indicator($row->cl_oui, $row->cl_non, $row->cl_nr),
                    'electricite' => $indicator($row->el_oui, $row->el_non, $row->el_nr),
                ];
            }, $rows);

            $sum = fn (string $indicator, string $field) => array_sum(array_map(fn ($e) => $e[$indicator][$field], $entities));
            $total = array_sum(array_column($entities, 'total'));
            $totals = ['total' => $total, 'ouvertes' => array_sum(array_column($entities, 'ouvertes'))];
            foreach (['titreFoncier', 'cloture', 'electricite'] as $indicator) {
                $oui = $sum($indicator, 'oui');
                $totals[$indicator] = [
                    'oui' => $oui,
                    'non' => $sum($indicator, 'non'),
                    'nonRenseigne' => $sum($indicator, 'nonRenseigne'),
                    'taux' => $total > 0 ? round($oui * 100 / $total, 1) : null,
                ];
            }

            return [
                'level' => $level,
                'parentId' => $parentId,
                'entities' => $entities,
                'totals' => $totals,
                'source' => 'tmpfosa, rattachement par géométrie (ST_Within)',
                'genereLe' => now()->toIso8601String(),
            ];
        });
    }

    /**
     * Sous-requête des entités d'un niveau : (id, label, geom). La sélection des
     * districts et aires de santé reprend celle des couches de la carte
     * (MapService) pour que les noms correspondent aux polygones affichés ; le
     * rattachement district -> région passe par le nom de région du district,
     * districts.region_id étant décalé dans le dump.
     */
    private function entitySelection(string $level, ?int $parentId): array
    {
        return match ($level) {
            'region' => ['SELECT r.id, r.nom AS label, r.geom FROM regions r', []],
            'departement' => $parentId
                ? ['SELECT d.id, d.departement AS label, d.geom FROM departements d WHERE d.region_id = ?', [$parentId]]
                : ['SELECT d.id, d.departement AS label, d.geom FROM departements d', []],
            'arrondissement' => ['SELECT a.id, a.nom AS label, a.geom FROM arrondissements a WHERE a.departement_id = ?', [$parentId]],
            'district' => ['SELECT DISTINCT d.id, d.nom_ds AS label, d.geom FROM districts d
                INNER JOIN regions r ON (ST_Contains(r.geom, d.geom) OR d.region COLLATE utf8mb4_unicode_ci = r.nom) AND r.id = ?', [$parentId]],
            'airesante' => ['SELECT DISTINCT a.id, a.nom_as AS label, a.geom FROM airesantes a
                INNER JOIN districts d ON (ST_Contains(d.geom, a.geom) OR a.district_id = d.id) AND d.id = ?', [$parentId]],
        };
    }

    /* ------------------------------------------------------------------ */
    /* Fiche détaillée d'une FOSA                                          */
    /* ------------------------------------------------------------------ */

    /**
     * Fiche d'une FOSA telle qu'affichée dans le panneau de la carte. Toutes les
     * valeurs viennent de la base ; un champ absent vaut null (le frontend
     * affiche « Donnée non disponible »).
     */
    public function fosaDetails(int $id): ?array
    {
        $f = DB::selectOne('SELECT id, nom, type, cat_rec, statut_rec, est_ferme, fonction, situation, image,
                org_unit, capacite_lits, a_titre_foncier, a_cloture, connectee_electricite, type_courant,
                latitude, longitude, geom IS NOT NULL AS has_geom, telephone, email, responsable_nom,
                responsable_telephone, nom_directeur, last_inspection, next_inspection,
                maintenance_priority, maintenance_issues, arrondissement_id, airesante_id
            FROM tmpfosa WHERE id = ?', [$id]);

        if (!$f) {
            return null;
        }

        $location = $this->locate($f);

        // Bâtiments par état
        $batiments = DB::select("SELECT COALESCE(NULLIF(etat, ''), 'Non renseigné') AS label, COUNT(*) AS total,
                COALESCE(SUM(superficie), 0) AS superficie
            FROM batiments WHERE fosa_id = ? GROUP BY label ORDER BY total DESC", [$id]);

        // Services, avec le nombre d'équipements biomédicaux de chacun
        $services = DB::select('SELECT s.id, s.nom, s.responsable, s.capacite,
                (SELECT COALESCE(SUM(COALESCE(e.quantite, 1)), 0) FROM equipebios e WHERE e.service_id = s.id) AS equipebios
            FROM services s WHERE s.fosa_id = ? ORDER BY s.nom', [$id]);

        // Personnel par catégorie
        $personnel = DB::select("SELECT COALESCE(c.nom, 'Non classé') AS label, COUNT(p.id) AS total
            FROM personnels p LEFT JOIN categories c ON c.id = p.categorie_id
            WHERE p.fosa_id = ? GROUP BY c.nom ORDER BY total DESC", [$id]);

        // Équipements biomédicaux (via les services) par état (colonne `fonction`)
        $equipebios = DB::select("SELECT COALESCE(NULLIF(e.fonction, ''), 'Non renseigné') AS label,
                COALESCE(SUM(COALESCE(e.quantite, 1)), 0) AS total
            FROM equipebios e INNER JOIN services s ON s.id = e.service_id
            WHERE s.fosa_id = ? GROUP BY label ORDER BY total DESC", [$id]);

        $equipements = DB::selectOne('SELECT COUNT(*) AS total FROM equipements e
            INNER JOIN services s ON s.id = e.service_id WHERE s.fosa_id = ?', [$id]);

        $vehicules = DB::selectOne("SELECT COALESCE(SUM(COALESCE(quantite, 1)), 0) AS total,
                COALESCE(SUM(CASE WHEN LOWER(CONCAT_WS(' ', type, type_vehicule, `usage`)) LIKE '%ambulance%'
                    THEN COALESCE(quantite, 1) ELSE 0 END), 0) AS ambulances
            FROM materielroulants WHERE fosa_id = ?", [$id]);

        $parametre = DB::selectOne('SELECT nombre_patients_totaux, nombre_patients_ambulants, `date`
            FROM parametres WHERE fosa_id = ? ORDER BY COALESCE(`date`, created_at) DESC LIMIT 1', [$id]);

        $bool = fn ($v) => $v === null ? null : (bool) $v;
        $text = fn ($v) => ($v === null || trim((string) $v) === '') ? null : trim((string) $v);
        $sumTotals = fn (array $rows) => array_sum(array_map(fn ($r) => (int) $r->total, $rows));

        $issues = null;
        if ($text($f->maintenance_issues)) {
            $decoded = json_decode($f->maintenance_issues, true);
            $issues = is_array($decoded) ? array_values(array_filter($decoded, 'is_string')) : [$f->maintenance_issues];
        }

        return [
            'id' => (int) $f->id,
            'nom' => $f->nom,
            'type' => $text($f->type),
            'categorie' => $text($f->cat_rec) ?? $text($f->type),
            'statut' => $text($f->statut_rec),
            'estFerme' => (bool) $f->est_ferme,
            'fonctionnelle' => $bool($f->fonction),
            'situation' => $text($f->situation),
            'orgUnit' => $text($f->org_unit),
            'image' => $text($f->image),
            'localisation' => $location + [
                'latitude' => $f->latitude !== null ? (float) $f->latitude : null,
                'longitude' => $f->longitude !== null ? (float) $f->longitude : null,
                'geolocalisee' => (bool) $f->has_geom,
            ],
            // capacite_lits vaut 0 par défaut dans le dump : 0 = non renseigné.
            'capaciteLits' => ((int) $f->capacite_lits) > 0 ? (int) $f->capacite_lits : null,
            'securite' => [
                'titreFoncier' => $bool($f->a_titre_foncier),
                'cloture' => $bool($f->a_cloture),
            ],
            'energie' => [
                'connecteeElectricite' => $bool($f->connectee_electricite),
                'typeCourant' => $text($f->type_courant),
            ],
            'contact' => [
                'telephone' => $text($f->telephone),
                'email' => $text($f->email),
                'responsableNom' => $text($f->responsable_nom),
                'responsableTelephone' => $text($f->responsable_telephone),
                'nomDirecteur' => $text($f->nom_directeur),
            ],
            'maintenance' => [
                'derniereInspection' => $f->last_inspection,
                'prochaineInspection' => $f->next_inspection,
                'priorite' => $text($f->maintenance_priority),
                'problemes' => $issues,
            ],
            'batiments' => [
                'total' => $sumTotals($batiments),
                'superficie' => (float) array_sum(array_map(fn ($r) => (float) $r->superficie, $batiments)),
                'parEtat' => array_map(fn ($r) => ['label' => $r->label, 'total' => (int) $r->total], $batiments),
            ],
            'services' => [
                'total' => count($services),
                'liste' => array_map(fn ($s) => [
                    'id' => (int) $s->id,
                    'nom' => $s->nom,
                    'responsable' => $text($s->responsable),
                    'capacite' => $s->capacite !== null ? (int) $s->capacite : null,
                    'equipementsBiomedicaux' => (int) $s->equipebios,
                ], $services),
            ],
            'personnel' => [
                'total' => $sumTotals($personnel),
                'parCategorie' => array_map(fn ($r) => ['label' => $r->label, 'total' => (int) $r->total], $personnel),
            ],
            'equipements' => [
                'biomedicaux' => $sumTotals($equipebios),
                'biomedicauxParEtat' => array_map(fn ($r) => ['label' => $r->label, 'total' => (int) $r->total], $equipebios),
                'autres' => (int) $equipements->total,
            ],
            'vehicules' => [
                'total' => (int) $vehicules->total,
                'ambulances' => (int) $vehicules->ambulances,
            ],
            'patients' => $parametre ? [
                'total' => $parametre->nombre_patients_totaux !== null ? (int) $parametre->nombre_patients_totaux : null,
                'ambulants' => $parametre->nombre_patients_ambulants !== null ? (int) $parametre->nombre_patients_ambulants : null,
                'date' => $parametre->date,
            ] : null,
        ];
    }

    /**
     * Région, département, arrondissement, district et aire de santé d'une FOSA :
     * par la géométrie du point, sinon par les clés étrangères.
     */
    private function locate(object $f): array
    {
        $within = function (string $sql) use ($f) {
            return $f->has_geom ? DB::selectOne($sql . ' LIMIT 1', [$f->id]) : null;
        };
        $point = '(SELECT geom FROM tmpfosa WHERE id = ?)';

        $arrondissement = $within("SELECT a.id, a.nom, a.departement_id FROM arrondissements a WHERE ST_Within({$point}, a.geom)");
        if (!$arrondissement && $f->arrondissement_id) {
            $arrondissement = DB::selectOne('SELECT id, nom, departement_id FROM arrondissements WHERE id = ?', [$f->arrondissement_id]);
        }

        $departement = $within("SELECT d.id, d.departement AS nom, d.region_id FROM departements d WHERE ST_Within({$point}, d.geom)");
        if (!$departement && $arrondissement) {
            $departement = DB::selectOne('SELECT id, departement AS nom, region_id FROM departements WHERE id = ?', [$arrondissement->departement_id]);
        }

        $region = $within("SELECT r.id, r.nom FROM regions r WHERE ST_Within({$point}, r.geom)");
        if (!$region && $departement) {
            $region = DB::selectOne('SELECT id, nom FROM regions WHERE id = ?', [$departement->region_id]);
        }

        $airesante = $within("SELECT a.id, a.nom_as AS nom, a.code_as AS code, a.district_id FROM airesantes a WHERE ST_Within({$point}, a.geom)");
        if (!$airesante && $f->airesante_id) {
            $airesante = DB::selectOne('SELECT id, nom_as AS nom, code_as AS code, district_id FROM airesantes WHERE id = ?', [$f->airesante_id]);
        }

        $district = $within("SELECT d.id, d.nom_ds AS nom, d.code_ds AS code FROM districts d WHERE ST_Within({$point}, d.geom)");
        if (!$district && $airesante) {
            $district = DB::selectOne('SELECT id, nom_ds AS nom, code_ds AS code FROM districts WHERE id = ?', [$airesante->district_id]);
        }

        $ref = fn ($row, array $extra = []) => $row ? ['id' => (int) $row->id, 'nom' => $row->nom] + array_intersect_key((array) $row, array_flip($extra)) : null;

        return [
            'region' => $ref($region),
            'departement' => $ref($departement),
            'arrondissement' => $ref($arrondissement),
            'district' => $ref($district, ['code']),
            'airesante' => $ref($airesante, ['code']),
        ];
    }
}
