<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @OA\Tag(name="Import", description="Import de donnees Excel")
 */
class ImportController extends Controller
{
    public function __construct(protected ImportService $importService) {}

    /**
     * @OA\Get(
     *     path="/import/tables",
     *     operationId="getImportTables",
     *     tags={"Import"},
     *     summary="Tables importables",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function tables(): JsonResponse
    {
        return $this->successResponse($this->importService->getImportableTables());
    }

    /**
     * @OA\Get(
     *     path="/import/{table}/structure",
     *     operationId="getImportStructure",
     *     tags={"Import"},
     *     summary="Structure d'une table",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="table", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function structure(string $table): JsonResponse
    {
        return $this->successResponse($this->importService->getTableStructure($table));
    }

    /**
     * @OA\Post(
     *     path="/import/{table}",
     *     operationId="importData",
     *     tags={"Import"},
     *     summary="Importer des donnees Excel",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="table", in="path", required=true, @OA\Schema(type="string")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(property="file", type="string", format="binary")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="OK")
     * )
     */
    public function import(Request $request, string $table): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv']);

        // Le frontend envoie les mappings FK en JSON dans un champ multipart
        $foreignKeyMappings = [];
        $rawMappings = $request->input('foreignKeyMappings');
        if (!empty($rawMappings)) {
            $decoded = is_array($rawMappings) ? $rawMappings : json_decode($rawMappings, true);
            if (is_array($decoded)) {
                $foreignKeyMappings = $decoded;
            }
        }

        $result = $this->importService->importData($table, $request->file('file'), $foreignKeyMappings);
        return $this->successResponse($result, 'Import termine');
    }

    /** @OA\Get(path="/import/{table}/template", tags={"Import"}, summary="Télécharger template Excel", security={{"bearerAuth":{}}}, @OA\Parameter(name="table", in="path", required=true, @OA\Schema(type="string")), @OA\Response(response=200, description="Fichier Excel")) */
    public function template(string $table)
    {
        $structure = $this->importService->getTableStructure($table);

        // Colonnes FK : exclues du modèle (renseignées via les listes déroulantes)
        $fkColumns = array_keys((array) $structure['foreignKeys']);
        $columns = array_filter(
            $structure['columns'],
            fn ($col) => !in_array($col['name'], $fkColumns, true)
        );

        $headers = array_map(fn ($col) => "{$col['name']} [{$col['type']}]", $columns);
        $typeRow = array_map(fn ($col) => match(true) {
            str_contains($col['type'], 'int') => 123,
            str_contains($col['type'], 'decimal') || str_contains($col['type'], 'double') => 12.34,
            str_contains($col['type'], 'date') => '2025-01-01',
            default => 'Texte exemple',
        }, $columns);

        $callback = function () use ($headers, $typeRow) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            fputcsv($file, $typeRow);
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$table}_template.csv",
        ]);
    }
}
