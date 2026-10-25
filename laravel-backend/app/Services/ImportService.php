<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\GenericImport;

class ImportService
{
    protected array $importableTables = [
        'regions', 'departements', 'arrondissements', 'communes', 'districts',
        'airesantes', 'tmpfosa', 'batiments', 'services', 'personnels',
        'equipements', 'equipebios', 'materielroulants', 'categories', 'degradations',
    ];

    /**
     * Colonnes jamais importables (gérées automatiquement par la base).
     */
    protected array $excludedColumns = ['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt', 'geom'];

    public function getImportableTables(): array
    {
        return $this->importableTables;
    }

    public function assertImportable(string $table): void
    {
        if (!in_array($table, $this->importableTables, true)) {
            throw new \InvalidArgumentException("Table '{$table}' non importable.");
        }
    }

    /**
     * Retourne la structure complète d'une table au format attendu par le frontend :
     * { table, columns[], foreignKeys{}, requiredColumns[] }
     */
    public function getTableStructure(string $table): array
    {
        $this->assertImportable($table);

        $database = DB::getDatabaseName();

        // Colonnes de la table
        $rawColumns = DB::select(
            'SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION',
            [$database, $table]
        );

        $columns = array_map(fn ($col) => [
            'name' => $col->COLUMN_NAME,
            'type' => $col->DATA_TYPE,
            'nullable' => $col->IS_NULLABLE === 'YES',
            'key' => $col->COLUMN_KEY,
            'auto_increment' => str_contains($col->EXTRA, 'auto_increment'),
        ], $rawColumns);

        // Clés étrangères
        $rawForeignKeys = DB::select(
            'SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL',
            [$database, $table]
        );

        $foreignKeys = [];
        foreach ($rawForeignKeys as $fk) {
            $foreignKeys[$fk->COLUMN_NAME] = [
                'referenced_table' => $fk->REFERENCED_TABLE_NAME,
                'referenced_column' => $fk->REFERENCED_COLUMN_NAME,
                'options' => $this->getForeignKeyOptions($database, $fk->REFERENCED_TABLE_NAME),
            ];
        }

        // Colonnes requises : NOT NULL, non auto-increment, hors timestamps/id/geom
        $requiredColumns = [];
        foreach ($rawColumns as $col) {
            if (
                $col->IS_NULLABLE === 'NO'
                && !str_contains($col->EXTRA, 'auto_increment')
                && !in_array($col->COLUMN_NAME, $this->excludedColumns, true)
            ) {
                $requiredColumns[] = $col->COLUMN_NAME;
            }
        }

        return [
            'table' => $table,
            'columns' => $columns,
            'foreignKeys' => (object) $foreignKeys, // (object) => "{}" en JSON si vide (jamais null)
            'requiredColumns' => $requiredColumns,
        ];
    }

    /**
     * Récupère jusqu'à 100 options affichables (id + libellé) d'une table référencée.
     * Essaie 'nom', puis 'name', puis la première colonne texte, sinon juste l'id.
     */
    protected function getForeignKeyOptions(string $database, string $referencedTable): array
    {
        $quoted = '`' . str_replace('`', '', $referencedTable) . '`';

        foreach (['nom', 'name', 'libelle', 'title'] as $labelColumn) {
            if ($this->columnExists($database, $referencedTable, $labelColumn)) {
                $rows = DB::select("SELECT id, `{$labelColumn}` AS nom FROM {$quoted} LIMIT 100");
                return array_map(fn ($r) => ['id' => $r->id, 'nom' => $r->nom], $rows);
            }
        }

        // Première colonne varchar/text disponible
        $textCol = DB::select(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
             AND DATA_TYPE IN ('varchar', 'text') AND COLUMN_NAME != 'id'
             ORDER BY ORDINAL_POSITION LIMIT 1",
            [$database, $referencedTable]
        );

        if (!empty($textCol)) {
            $colName = '`' . str_replace('`', '', $textCol[0]->COLUMN_NAME) . '`';
            $rows = DB::select("SELECT id, {$colName} AS nom FROM {$quoted} LIMIT 100");
            return array_map(fn ($r) => ['id' => $r->id, 'nom' => $r->nom], $rows);
        }

        // Dernier recours : juste l'id
        $rows = DB::select("SELECT id, CAST(id AS CHAR) AS nom FROM {$quoted} LIMIT 100");
        return array_map(fn ($r) => ['id' => $r->id, 'nom' => $r->nom], $rows);
    }

    protected function columnExists(string $database, string $table, string $column): bool
    {
        $result = DB::select(
            'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
            [$database, $table, $column]
        );

        return !empty($result);
    }

    /**
     * Liste des colonnes insérables (hors auto-increment / timestamps / geom).
     */
    public function getInsertableColumns(string $table): array
    {
        $database = DB::getDatabaseName();

        $rawColumns = DB::select(
            'SELECT COLUMN_NAME, EXTRA
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION',
            [$database, $table]
        );

        $insertable = [];
        foreach ($rawColumns as $col) {
            if (
                !str_contains($col->EXTRA, 'auto_increment')
                && !in_array($col->COLUMN_NAME, $this->excludedColumns, true)
            ) {
                $insertable[] = $col->COLUMN_NAME;
            }
        }

        return $insertable;
    }

    /**
     * Importe un fichier Excel/CSV dans la table.
     * Retourne { total, success, errors, errorDetails } (contrat frontend).
     */
    public function importData(string $table, UploadedFile $file, array $foreignKeyMappings = []): array
    {
        $this->assertImportable($table);

        $insertableColumns = $this->getInsertableColumns($table);

        $import = new GenericImport($table, $insertableColumns, $foreignKeyMappings);
        Excel::import($import, $file);

        $errorDetails = $import->getErrors();

        return [
            'total' => $import->getTotal(),
            'success' => $import->getRowCount(),
            'errors' => count($errorDetails),
            'errorDetails' => array_slice($errorDetails, 0, 10),
        ];
    }
}
