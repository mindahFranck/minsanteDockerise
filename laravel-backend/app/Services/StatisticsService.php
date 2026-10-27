<?php

namespace App\Services;

use App\Models\{Region, Departement, Fosa, Personnel, Equipement, Batiment, Equipebio, Materielroulant, Parametre};
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    public function getOverview(): array
    {
        return [
            'regions' => Region::count(),
            'departements' => Departement::count(),
            'fosas' => Fosa::count(),
            'fosas_ouvertes' => Fosa::functional()->count(),
            'fosas_fermees' => Fosa::closed()->count(),
            'personnel' => Personnel::count(),
            'equipements' => Equipement::count(),
            'equipements_biomedicaux' => Equipebio::count(),
            'batiments' => Batiment::count(),
            'materiel_roulant' => Materielroulant::count(),
            'capacite_lits_totale' => Fosa::sum('capacite_lits'),
        ];
    }

    public function getFosaStatistics(): array
    {
        return [
            'par_type' => Fosa::select('type', DB::raw('COUNT(*) as total'))
                ->groupBy('type')->orderByDesc('total')->get(),
            'par_region' => DB::table('tmpfosa')
                ->join('arrondissements', 'tmpfosa.arrondissement_id', '=', 'arrondissements.id')
                ->join('departements', 'arrondissements.departement_id', '=', 'departements.id')
                ->join('regions', 'departements.region_id', '=', 'regions.id')
                ->select('regions.nom as region', DB::raw('COUNT(tmpfosa.id) as total'))
                ->groupBy('regions.nom')->orderByDesc('total')->get(),
            'capacite_lits' => [
                'total' => Fosa::sum('capacite_lits'),
                'moyenne' => round(Fosa::avg('capacite_lits'), 2),
            ],
            'statut' => [
                'ouvertes' => Fosa::functional()->count(),
                'fermees' => Fosa::closed()->count(),
            ],
        ];
    }

    public function getPersonnelStatistics(): array
    {
        return [
            'total' => Personnel::count(),
            'par_categorie' => Personnel::select('categories.nom as categorie', DB::raw('COUNT(personnels.id) as total'))
                ->leftJoin('categories', 'personnels.categorie_id', '=', 'categories.id')
                ->groupBy('categories.nom')->orderByDesc('total')->get(),
            'par_region' => DB::table('personnels')
                ->join('tmpfosa', 'personnels.fosa_id', '=', 'tmpfosa.id')
                ->join('arrondissements', 'tmpfosa.arrondissement_id', '=', 'arrondissements.id')
                ->join('departements', 'arrondissements.departement_id', '=', 'departements.id')
                ->join('regions', 'departements.region_id', '=', 'regions.id')
                ->select('regions.nom as region', DB::raw('COUNT(personnels.id) as total'))
                ->groupBy('regions.nom')->orderByDesc('total')->get(),
        ];
    }

    public function getEquipmentStatistics(): array
    {
        return [
            'equipements' => [
                'total' => Equipement::count(),
                'par_type' => Equipement::select('type', DB::raw('COUNT(*) as total'))
                    ->groupBy('type')->orderByDesc('total')->get(),
            ],
            'equipements_biomedicaux' => [
                'total' => Equipebio::count(),
                'par_type' => Equipebio::select('type', DB::raw('COUNT(*) as total'))
                    ->groupBy('type')->orderByDesc('total')->get(),
            ],
            'materiel_roulant' => [
                'total' => Materielroulant::count(),
                'par_type' => Materielroulant::select('type', DB::raw('COUNT(*) as total'))
                    ->groupBy('type')->orderByDesc('total')->get(),
            ],
        ];
    }

    public function getGeographicDistribution(): array
    {
        return [
            'regions' => DB::table('regions')
                ->leftJoin('departements', 'regions.id', '=', 'departements.region_id')
                ->select('regions.id', 'regions.nom', 'regions.population', DB::raw('COUNT(departements.id) as totalDepartements'))
                ->groupBy('regions.id', 'regions.nom', 'regions.population')
                ->get(),
        ];
    }

    public function getBuildingStatistics(): array
    {
        return [
            'byType' => Batiment::select('type', DB::raw('COUNT(id) as count'))
                ->groupBy('type')->get(),
            'byState' => Batiment::select('etat', DB::raw('COUNT(id) as count'))
                ->groupBy('etat')->get(),
            'total' => Batiment::count(),
        ];
    }

    public function getPatientStatistics(): array
    {
        $stats = DB::table('parametres')->selectRaw(
            'COALESCE(SUM(nombre_patients_ambulants), 0) as totalAmbulants, COALESCE(SUM(nombre_patients_totaux), 0) as totalPatients'
        )->first();

        return [
            'totalAmbulants' => (int) $stats->totalAmbulants,
            'totalPatients' => (int) $stats->totalPatients,
        ];
    }

    public function getComparativeStatistics(): array
    {
        $fosasByCategory = DB::select("SELECT
            COALESCE(cat_rec, 'Non spécifié') as category, COUNT(*) as total,
            SUM(CASE WHEN a_titre_foncier = 1 THEN 1 ELSE 0 END) as withTF,
            SUM(CASE WHEN a_cloture = 1 THEN 1 ELSE 0 END) as withCloture,
            SUM(CASE WHEN fonction = 1 THEN 1 ELSE 0 END) as operational
            FROM tmpfosa GROUP BY cat_rec ORDER BY total DESC");

        $fosasByStatus = DB::select("SELECT
            COALESCE(statut_rec, 'Non spécifié') as status, COUNT(*) as total,
            SUM(CASE WHEN a_titre_foncier = 1 THEN 1 ELSE 0 END) as withTF,
            SUM(CASE WHEN a_cloture = 1 THEN 1 ELSE 0 END) as withCloture
            FROM tmpfosa GROUP BY statut_rec ORDER BY total DESC");

        $buildingsByFosa = DB::select("SELECT f.nom as fosaName, f.cat_rec as category, COUNT(b.id) as buildingCount
            FROM tmpfosa f LEFT JOIN batiments b ON f.id = b.fosa_id
            GROUP BY f.id, f.nom, f.cat_rec HAVING buildingCount > 0
            ORDER BY buildingCount DESC LIMIT 10");

        $vehiclesByTypeEnergy = DB::select("SELECT
            COALESCE(type_vehicule, type, 'Non spécifié') as vehicleType,
            COALESCE(energie, 'Non spécifié') as energy,
            COUNT(*) as count, SUM(quantite) as totalQuantity
            FROM materielroulants GROUP BY vehicleType, energie ORDER BY count DESC");

        $personnelDistribution = DB::select("SELECT c.nom as category, COUNT(p.id) as count, COUNT(DISTINCT p.fosa_id) as fosasCount
            FROM personnels p LEFT JOIN categories c ON p.categorie_id = c.id
            GROUP BY c.nom ORDER BY count DESC");

        $securityStats = DB::selectOne("SELECT
            SUM(CASE WHEN a_titre_foncier = 1 AND a_cloture = 1 THEN 1 ELSE 0 END) as `both`,
            SUM(CASE WHEN a_titre_foncier = 1 AND a_cloture = 0 THEN 1 ELSE 0 END) as tfOnly,
            SUM(CASE WHEN a_titre_foncier = 0 AND a_cloture = 1 THEN 1 ELSE 0 END) as clotureOnly,
            SUM(CASE WHEN a_titre_foncier = 0 AND a_cloture = 0 THEN 1 ELSE 0 END) as neither,
            COUNT(*) as total FROM tmpfosa");

        return [
            'fosasByCategory' => $fosasByCategory,
            'fosasByStatus' => $fosasByStatus,
            'buildingsByFosa' => $buildingsByFosa,
            'vehiclesByTypeEnergy' => $vehiclesByTypeEnergy,
            'personnelDistribution' => $personnelDistribution,
            'securityStats' => $securityStats,
        ];
    }

    /**
     * Indicateurs du tableau de bord, calculés en une passe par table.
     * Lecture seule ; mis en cache 5 minutes (les données changent par import).
     */
    public function getDashboard(): array
    {
        return Cache::remember('statistics.dashboard', 300, function () {
            $f = DB::selectOne("SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN est_ferme = 0 THEN 1 ELSE 0 END) AS ouvertes,
                SUM(CASE WHEN est_ferme = 1 THEN 1 ELSE 0 END) AS fermees,
                SUM(CASE WHEN fonction = 1 THEN 1 ELSE 0 END) AS fonctionnelles,
                SUM(CASE WHEN connectee_electricite = 1 THEN 1 ELSE 0 END) AS electrifiees,
                SUM(CASE WHEN a_titre_foncier = 1 THEN 1 ELSE 0 END) AS titre_foncier,
                SUM(CASE WHEN a_cloture = 1 THEN 1 ELSE 0 END) AS cloturees,
                SUM(CASE WHEN a_titre_foncier = 1 AND a_cloture = 1 THEN 1 ELSE 0 END) AS securisees,
                SUM(CASE WHEN latitude <> 0 AND longitude <> 0 THEN 1 ELSE 0 END) AS geolocalisees,
                COALESCE(SUM(capacite_lits), 0) AS lits,
                SUM(CASE WHEN maintenance_priority = 'urgent' THEN 1 ELSE 0 END) AS maintenance_urgente,
                SUM(CASE WHEN maintenance_priority = 'high' THEN 1 ELSE 0 END) AS maintenance_haute,
                SUM(CASE WHEN next_inspection IS NOT NULL AND next_inspection < CURDATE() THEN 1 ELSE 0 END) AS inspections_en_retard
                FROM tmpfosa");

            $parRegion = DB::select("SELECT
                COALESCE(r.nom, 'Non rattachée') AS region,
                COUNT(f.id) AS total,
                SUM(CASE WHEN f.est_ferme = 0 THEN 1 ELSE 0 END) AS ouvertes,
                SUM(CASE WHEN f.connectee_electricite = 1 THEN 1 ELSE 0 END) AS electrifiees,
                SUM(CASE WHEN f.a_titre_foncier = 1 AND f.a_cloture = 1 THEN 1 ELSE 0 END) AS securisees,
                COALESCE(SUM(f.capacite_lits), 0) AS lits
                FROM tmpfosa f
                LEFT JOIN arrondissements a ON f.arrondissement_id = a.id
                LEFT JOIN departements d ON a.departement_id = d.id
                LEFT JOIN regions r ON d.region_id = r.id
                GROUP BY r.nom ORDER BY total DESC");

            $parCategorie = DB::select("SELECT COALESCE(NULLIF(cat_rec, ''), 'Non spécifiée') AS label, COUNT(*) AS total,
                SUM(CASE WHEN est_ferme = 0 THEN 1 ELSE 0 END) AS ouvertes
                FROM tmpfosa GROUP BY label ORDER BY total DESC");

            $parStatut = DB::select("SELECT COALESCE(NULLIF(statut_rec, ''), 'Non spécifié') AS label, COUNT(*) AS total,
                SUM(CASE WHEN est_ferme = 0 THEN 1 ELSE 0 END) AS ouvertes
                FROM tmpfosa GROUP BY label ORDER BY total DESC");

            $parType = DB::select("SELECT COALESCE(NULLIF(type, ''), 'Non spécifié') AS label, COUNT(*) AS total,
                SUM(CASE WHEN est_ferme = 0 THEN 1 ELSE 0 END) AS ouvertes
                FROM tmpfosa GROUP BY label ORDER BY total DESC");

            $personnel = DB::selectOne("SELECT COUNT(*) AS total, COUNT(DISTINCT fosa_id) AS fosas_dotees FROM personnels");
            $personnelParCategorie = DB::select("SELECT COALESCE(c.nom, 'Non classé') AS label, COUNT(p.id) AS total
                FROM personnels p LEFT JOIN categories c ON p.categorie_id = c.id
                GROUP BY c.nom ORDER BY total DESC");

            $batiments = DB::selectOne("SELECT COUNT(*) AS total, COALESCE(SUM(superficie), 0) AS superficie FROM batiments");
            $batimentsParEtat = DB::select("SELECT COALESCE(NULLIF(etat, ''), 'Non renseigné') AS label, COUNT(*) AS total
                FROM batiments GROUP BY label ORDER BY total DESC");

            $equipebios = DB::selectOne("SELECT COALESCE(SUM(COALESCE(quantite, 1)), 0) AS total FROM equipebios");
            $equipements = DB::selectOne("SELECT COUNT(*) AS total FROM equipements");
            $vehicules = DB::selectOne("SELECT COALESCE(SUM(COALESCE(quantite, 1)), 0) AS total FROM materielroulants");
            $vehiculesParEtat = DB::select("SELECT COALESCE(NULLIF(etat, ''), 'Non renseigné') AS label,
                COALESCE(SUM(COALESCE(quantite, 1)), 0) AS total
                FROM materielroulants GROUP BY label ORDER BY total DESC");
            $vehiculesParEnergie = DB::select("SELECT COALESCE(NULLIF(energie, ''), 'Non renseignée') AS label,
                COALESCE(SUM(COALESCE(quantite, 1)), 0) AS total
                FROM materielroulants GROUP BY label ORDER BY total DESC");

            $patients = DB::selectOne("SELECT COALESCE(SUM(nombre_patients_totaux), 0) AS total,
                COALESCE(SUM(nombre_patients_ambulants), 0) AS ambulants FROM parametres");

            $int = fn ($rows) => array_map(function ($row) {
                return array_map(fn ($v) => is_numeric($v) ? (int) $v : $v, (array) $row);
            }, $rows);

            return [
                'fosas' => array_map('intval', (array) $f),
                'parRegion' => $int($parRegion),
                'parCategorie' => $int($parCategorie),
                'parStatut' => $int($parStatut),
                'parType' => $int($parType),
                'personnel' => [
                    'total' => (int) $personnel->total,
                    'fosasDotees' => (int) $personnel->fosas_dotees,
                    'parCategorie' => $int($personnelParCategorie),
                ],
                'batiments' => [
                    'total' => (int) $batiments->total,
                    'superficie' => (float) $batiments->superficie,
                    'parEtat' => $int($batimentsParEtat),
                ],
                'equipements' => [
                    'biomedicaux' => (int) $equipebios->total,
                    'autres' => (int) $equipements->total,
                ],
                'vehicules' => [
                    'total' => (int) $vehicules->total,
                    'parEtat' => $int($vehiculesParEtat),
                    'parEnergie' => $int($vehiculesParEnergie),
                ],
                'patients' => [
                    'total' => (int) $patients->total,
                    'ambulants' => (int) $patients->ambulants,
                ],
                'genereLe' => now()->toIso8601String(),
            ];
        });
    }
}
