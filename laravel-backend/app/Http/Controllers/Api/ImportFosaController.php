<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ImportFosaController extends Controller
{
    /** @OA\Post(path="/import-fosa/clear-and-import", tags={"Import FOSA"}, summary="Effacer et réimporter les FOSA", security={{"bearerAuth":{}}}, @OA\Response(response=200, description="Import terminé")) */
    public function clearAndImport(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file']);

        $stats = ['total' => 0, 'success' => 0, 'errors' => 0];

        try {
            // Read uploaded SQL file
            $content = file_get_contents($request->file('file')->getRealPath());

            // Clear existing data
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('tmpfosa')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            // Get valid FK IDs
            $firstAiresante = DB::table('airesantes')->orderBy('id')->value('id') ?? 1;
            $firstArrondissement = DB::table('arrondissements')->orderBy('id')->value('id') ?? 1;

            // Extract INSERT statements
            preg_match_all('/INSERT\s+INTO.*?VALUES\s*\((.*?)\);/is', $content, $matches);

            if (empty($matches[1])) {
                // Try line-by-line VALUES
                preg_match_all('/\(([^)]+)\)/s', $content, $matches);
            }

            foreach ($matches[1] ?? [] as $values) {
                $stats['total']++;
                try {
                    $fields = str_getcsv($values, ',', "'");
                    $fields = array_map(fn ($f) => trim($f) === 'NULL' ? null : trim($f, " '\"") , $fields);

                    $toBool = function ($val) {
                        if ($val === null) return 0;
                        return in_array(strtolower($val), ['oui', 'yes', '1', 'true']) ? 1 : 0;
                    };

                    $lng = isset($fields[11]) && is_numeric($fields[11]) ? (float) $fields[11] : 0;
                    $lat = isset($fields[12]) && is_numeric($fields[12]) ? (float) $fields[12] : 0;

                    DB::table('tmpfosa')->insert([
                        'nom' => $fields[14] ?? 'Sans nom',
                        'type' => $fields[4] ?? null,
                        'capacite_lits' => is_numeric($fields[9] ?? '') ? (int) $fields[9] : 0,
                        'est_ferme' => 0,
                        'situation' => $fields[3] ?? null,
                        'image' => null,
                        'org_unit' => null,
                        'fonction' => $toBool($fields[1] ?? null),
                        'statut_rec' => $fields[2] ?? null,
                        'cat_rec' => $fields[4] ?? null,
                        'nom_directeur' => 'Non spécifié',
                        'arrondissement_id' => $firstArrondissement,
                        'airesante_id' => $firstAiresante,
                        'longitude' => $lng,
                        'latitude' => $lat,
                        'geom' => DB::raw("ST_GeomFromText('POINT({$lng} {$lat})', 4326)"),
                        'a_cloture' => $toBool($fields[10] ?? null),
                        'a_titre_foncier' => $toBool($fields[6] ?? null),
                        'connectee_electricite' => 0,
                        'type_courant' => null,
                        'createdAt' => now(),
                        'updatedAt' => now(),
                    ]);
                    $stats['success']++;
                } catch (\Exception $e) {
                    $stats['errors']++;
                }
            }

            $stats['inDatabase'] = DB::table('tmpfosa')->count();

            return $this->successResponse($stats, 'Import terminé');
        } catch (\Exception $e) {
            return $this->errorResponse('Erreur lors de l\'import: ' . $e->getMessage(), 500);
        }
    }
}
