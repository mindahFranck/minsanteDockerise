<?php

namespace App\Imports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToArray;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class GenericImport implements ToArray, WithHeadingRow
{
    protected int $rowCount = 0;
    protected int $total = 0;
    protected array $errors = [];

    /**
     * @param string $table              Table cible
     * @param array  $insertableColumns  Colonnes autorisées à l'insertion
     * @param array  $foreignKeyMappings Valeurs FK par défaut [colonne => id]
     */
    public function __construct(
        protected string $table,
        protected array $insertableColumns = [],
        protected array $foreignKeyMappings = []
    ) {}

    public function array(array $rows): void
    {
        foreach ($rows as $index => $row) {
            // Ligne réellement vide -> ignorée (ne compte pas dans le total)
            $cleaned = array_filter($row, fn ($v) => $v !== null && $v !== '');
            if (empty($cleaned)) {
                continue;
            }

            $this->total++;

            try {
                // Nettoyer les en-têtes : "nom [varchar]" -> "nom"
                $data = [];
                foreach ($cleaned as $key => $value) {
                    $cleanKey = trim(explode('[', (string) $key)[0]);
                    $cleanKey = trim(explode(' ', $cleanKey)[0]);
                    if ($cleanKey !== '') {
                        $data[$cleanKey] = $value;
                    }
                }

                // Appliquer les valeurs FK par défaut si absentes du fichier
                foreach ($this->foreignKeyMappings as $fkColumn => $fkValue) {
                    if (!isset($data[$fkColumn]) || $data[$fkColumn] === '' || $data[$fkColumn] === null) {
                        $data[$fkColumn] = $fkValue;
                    }
                }

                // Ne garder que les colonnes insérables (si la liste est connue)
                if (!empty($this->insertableColumns)) {
                    $data = array_intersect_key($data, array_flip($this->insertableColumns));
                }

                if (empty($data)) {
                    throw new \RuntimeException('Aucune colonne valide à importer sur cette ligne.');
                }

                $data['created_at'] = now();
                $data['updated_at'] = now();

                DB::table($this->table)->insert($data);
                $this->rowCount++;
            } catch (\Throwable $e) {
                $this->errors[] = [
                    'row' => $index + 2, // +2 : ligne 1 = en-têtes, index base 0
                    'error' => $e->getMessage(),
                ];
            }
        }
    }

    public function getRowCount(): int { return $this->rowCount; }
    public function getTotal(): int { return $this->total; }
    public function getErrors(): array { return $this->errors; }
}
