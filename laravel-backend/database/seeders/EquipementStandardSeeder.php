<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Peuple la table `equipements_standard` depuis le catalogue JSON
 * (database/data/equipements-standard.json), issu des documents LISTE STANDARD.
 * Idempotent : ne fait rien si la table contient déjà des lignes.
 */
class EquipementStandardSeeder extends Seeder
{
    public function run(): void
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('equipements_standard')) {
            $this->command?->warn('Table equipements_standard absente, seeding ignoré.');
            return;
        }
        if (DB::table('equipements_standard')->exists()) {
            $this->command?->info('equipements_standard déjà peuplée, seeding ignoré.');
            return;
        }

        $path = database_path('data/equipements-standard.json');
        if (!is_file($path)) {
            $this->command?->warn("Fichier catalogue introuvable : {$path}");
            return;
        }

        $data = json_decode(file_get_contents($path), true);
        if (!is_array($data) || empty($data['categories'])) {
            $this->command?->warn('Catalogue JSON invalide ou vide.');
            return;
        }

        $now = now();
        $rows = [];
        foreach ($data['categories'] as $cat) {
            $code = $cat['code'] ?? null;
            if (!$code) {
                continue;
            }
            foreach ($cat['services'] ?? [] as $service) {
                $nomService = $service['nom'] ?? null;
                foreach ($service['equipements'] ?? [] as $eq) {
                    $designation = trim((string) ($eq['designation'] ?? ''));
                    if ($designation === '') {
                        continue;
                    }
                    $rows[] = [
                        'categorie_fosa' => $code,
                        'service' => $nomService ? mb_substr($nomService, 0, 150) : null,
                        'famille' => \App\Models\EquipementStandard::familleFromService($nomService),
                        'code' => isset($eq['code']) && $eq['code'] !== '' ? mb_substr((string) $eq['code'], 0, 50) : null,
                        'designation' => mb_substr($designation, 0, 500),
                        'specifications' => $eq['specifications'] ?? null,
                        'quantite_standard' => isset($eq['quantite']) && $eq['quantite'] !== '' ? mb_substr((string) $eq['quantite'], 0, 50) : null,
                        'prix_unitaire' => isset($eq['prix']) && $eq['prix'] !== '' ? mb_substr((string) $eq['prix'], 0, 50) : null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('equipements_standard')->insert($chunk);
        }

        $this->command?->info('equipements_standard : ' . count($rows) . ' lignes insérées.');
    }
}
