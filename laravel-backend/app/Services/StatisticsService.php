<?php

namespace App\Services;

use App\Models\{Region, Departement, Fosa, Personnel, Equipement, Batiment, Equipebio, Materielroulant, Parametre};
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
}
