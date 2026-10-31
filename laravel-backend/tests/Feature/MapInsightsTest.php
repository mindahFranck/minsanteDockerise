<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Carte publique (analyse thématique, fiche FOSA) et colonne FOSA des listes
 * d'équipements.
 *
 * Ces tests s'exécutent sur une copie LOCALE du dump de production (la base
 * n'a pas de migrations à jour : aucun RefreshDatabase). Ils sont ignorés si
 * les tables du dump sont absentes. Les seules écritures (jeu d'essai « sans
 * FOSA ») sont annulées par DatabaseTransactions.
 *
 *   DB_DATABASE=minsante_test php artisan test --filter=MapInsightsTest
 */
class MapInsightsTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        config(['cache.default' => 'array']);

        if (!Schema::hasTable('tmpfosa') || !Schema::hasTable('regions') || DB::table('tmpfosa')->count() === 0) {
            $this->markTestSkipped('Copie locale du dump MINSANTÉ requise (tables tmpfosa, regions…).');
        }
    }

    private function authHeader(): array
    {
        $user = User::where('role', 'super_admin')->where('is_active', 1)->first();
        if (!$user) {
            $this->markTestSkipped('Aucun super_admin dans la copie locale.');
        }

        return ['Authorization' => 'Bearer ' . auth('api')->login($user)];
    }

    /* --- Analyse thématique ------------------------------------------------ */

    public function test_thematic_by_region_matches_spatial_counts(): void
    {
        $response = $this->getJson('/api/v1/fosas/thematic?level=region');
        $response->assertOk()->assertJsonPath('data.level', 'region');

        $entities = collect($response->json('data.entities'));
        $this->assertCount(DB::table('regions')->count(), $entities);

        $expected = collect(DB::select('SELECT r.id, COUNT(f.id) AS total,
                SUM(CASE WHEN f.a_titre_foncier = 1 THEN 1 ELSE 0 END) AS tf,
                SUM(CASE WHEN f.a_cloture = 1 THEN 1 ELSE 0 END) AS cl
            FROM regions r LEFT JOIN tmpfosa f ON f.geom IS NOT NULL AND ST_Within(f.geom, r.geom)
            GROUP BY r.id'))->keyBy('id');

        foreach ($entities as $entity) {
            $row = $expected[$entity['id']];
            $this->assertSame((int) $row->total, $entity['total'], "total {$entity['nom']}");
            $this->assertSame((int) $row->tf, $entity['titreFoncier']['oui'], "titre foncier {$entity['nom']}");
            $this->assertSame((int) $row->cl, $entity['cloture']['oui'], "clôture {$entity['nom']}");
            // oui + non + non renseigné = total : aucune valeur supposée
            foreach (['titreFoncier', 'cloture', 'electricite'] as $key) {
                $i = $entity[$key];
                $this->assertSame($entity['total'], $i['oui'] + $i['non'] + $i['nonRenseigne']);
            }
        }
    }

    public function test_thematic_districts_of_a_region_use_the_district_region_name(): void
    {
        // districts.region_id est décalé dans le dump : le Littoral ne doit lister
        // que des districts dont la région (colonne texte) est « Littoral ».
        $littoral = DB::table('regions')->where('nom', 'Littoral')->first();
        if (!$littoral) {
            $this->markTestSkipped('Région Littoral absente.');
        }

        $response = $this->getJson("/api/v1/fosas/thematic?level=district&region_id={$littoral->id}");
        $response->assertOk();

        $names = collect($response->json('data.entities'))->pluck('nom');
        $this->assertNotEmpty($names);
        $regions = DB::table('districts')->whereIn('nom_ds', $names)->pluck('region')->unique()->values()->all();
        $this->assertSame(['Littoral'], $regions);
    }

    public function test_thematic_validates_level_and_parent(): void
    {
        $this->getJson('/api/v1/fosas/thematic?level=inconnu')->assertStatus(422);
        $this->getJson('/api/v1/fosas/thematic?level=district')->assertStatus(422);
        $this->getJson('/api/v1/fosas/thematic?level=airesante&district_id=abc')->assertStatus(422);
    }

    /* --- Fiche FOSA -------------------------------------------------------- */

    public function test_fosa_details_come_from_the_database(): void
    {
        $fosaId = DB::table('services')->whereNotNull('fosa_id')->value('fosa_id')
            ?? DB::table('tmpfosa')->whereNotNull('geom')->value('id');

        $response = $this->getJson("/api/v1/fosas/{$fosaId}/details");
        $response->assertOk()->assertJsonPath('data.id', (int) $fosaId);

        $fosa = DB::table('tmpfosa')->where('id', $fosaId)->first();
        $data = $response->json('data');

        $this->assertSame($fosa->nom, $data['nom']);
        $this->assertSame(DB::table('services')->where('fosa_id', $fosaId)->count(), $data['services']['total']);
        $this->assertSame(DB::table('batiments')->where('fosa_id', $fosaId)->count(), $data['batiments']['total']);
        $this->assertSame(DB::table('personnels')->where('fosa_id', $fosaId)->count(), $data['personnel']['total']);
        $this->assertSame(
            (int) DB::table('equipebios')->join('services', 'services.id', '=', 'equipebios.service_id')
                ->where('services.fosa_id', $fosaId)->sum(DB::raw('COALESCE(equipebios.quantite, 1)')),
            $data['equipements']['biomedicaux'],
        );
        $this->assertSame($fosa->a_titre_foncier === null ? null : (bool) $fosa->a_titre_foncier, $data['securite']['titreFoncier']);

        $region = DB::selectOne('SELECT r.nom FROM regions r, tmpfosa f WHERE f.id = ? AND ST_Within(f.geom, r.geom) LIMIT 1', [$fosaId]);
        $this->assertSame($region?->nom, $data['localisation']['region']['nom'] ?? null);

        // Champs absents de la base : null, jamais une valeur inventée
        if ($fosa->last_inspection === null) {
            $this->assertNull($data['maintenance']['derniereInspection']);
        }
        if ((int) $fosa->capacite_lits === 0) {
            $this->assertNull($data['capaciteLits']);
        }
    }

    public function test_fosa_details_lists_buildings_equipment_and_vehicles(): void
    {
        // HD Nkondjock (id 3880) : seule FOSA du dump avec bâtiments, services et équipements.
        if (!DB::table('tmpfosa')->where('id', 3880)->exists()) {
            $this->markTestSkipped('HD Nkondjock (3880) absente de la copie.');
        }

        $data = $this->getJson('/api/v1/fosas/3880/details')->assertOk()->json('data');

        // Bâtiments : une ligne par bâtiment de batiments.fosa_id
        $batiments = collect($data['batiments']['liste']);
        $this->assertSame(2, $batiments->count());
        $this->assertEqualsCanonicalizing(
            DB::table('batiments')->where('fosa_id', 3880)->pluck('nom')->all(),
            $batiments->pluck('nom')->all(),
        );
        $this->assertSame(['Bon'], $batiments->pluck('etat')->unique()->values()->all());

        // Lien bâtiment -> services -> équipements, par services.batiment_id
        foreach ($batiments as $batiment) {
            foreach ($batiment['services'] as $service) {
                $this->assertSame($batiment['id'], (int) DB::table('services')->where('id', $service['id'])->value('batiment_id'));
                $this->assertSame(
                    DB::table('equipebios')->where('service_id', $service['id'])->count(),
                    count($service['equipementsBiomedicaux']),
                );
            }
        }
        $this->assertSame([], $data['batiments']['servicesHorsBatiment']);

        // Équipements biomédicaux : 10 références, 13 unités
        $equipebios = collect($data['equipements']['biomedicauxListe']);
        $this->assertSame(10, $equipebios->count());
        $this->assertSame(13, $equipebios->sum('quantite'));
        $this->assertSame(13, $data['equipements']['biomedicaux']);
        $centrifugeuse = $equipebios->firstWhere('nom', 'Centrifugeuse');
        $this->assertSame(2, $centrifugeuse['quantite']);
        $this->assertSame('Laboratoire', $centrifugeuse['service']['nom']);
        $this->assertSame('2026-01-01', $centrifugeuse['dateAcquisition']);
        $this->assertNull($centrifugeuse['etat']); // colonne fonction vide : pas d'état inventé

        // Autres équipements et véhicules : aucun en base pour cette FOSA
        $this->assertSame([], $data['equipements']['autresListe']);
        $this->assertSame([], $data['vehicules']['liste']);
    }

    public function test_fosa_details_lists_vehicles(): void
    {
        $vehicule = DB::table('materielroulants')->first();
        if (!$vehicule) {
            $this->markTestSkipped('Aucun véhicule dans la copie.');
        }

        $liste = collect($this->getJson("/api/v1/fosas/{$vehicule->fosa_id}/details")->assertOk()->json('data.vehicules.liste'));
        $row = $liste->firstWhere('id', $vehicule->id);
        $this->assertNotNull($row);
        $this->assertSame($vehicule->immatriculation, $row['immatriculation']);
        $this->assertSame($vehicule->etat, $row['etat']);
        $this->assertSame($vehicule->energie, $row['energie']);
    }

    public function test_fosa_details_unknown_id_returns_404(): void
    {
        $this->getJson('/api/v1/fosas/999999999/details')->assertNotFound();
    }

    public function test_fosa_show_no_longer_fails_on_equipment_relations(): void
    {
        // equipements / equipebios n'ont pas de fosa_id : la relation passe par services.
        $fosaId = DB::table('tmpfosa')->value('id');
        $this->getJson("/api/v1/fosas/{$fosaId}")->assertOk();
    }

    /* --- Colonne FOSA des équipements ------------------------------------- */

    public function test_equipebios_list_returns_the_owning_fosa_without_n_plus_one(): void
    {
        if (DB::table('equipebios')->count() === 0) {
            $this->markTestSkipped('Aucun équipement biomédical dans la copie.');
        }
        $headers = $this->authHeader();

        DB::enableQueryLog();
        $response = $this->getJson('/api/v1/equipebios', $headers);
        $queries = count(DB::getQueryLog());
        DB::disableQueryLog();

        $response->assertOk();
        foreach ($response->json('data') as $item) {
            $expected = DB::table('equipebios')
                ->join('services', 'services.id', '=', 'equipebios.service_id')
                ->leftJoin('tmpfosa', 'tmpfosa.id', '=', 'services.fosa_id')
                ->where('equipebios.id', $item['id'])
                ->first(['tmpfosa.id', 'tmpfosa.nom']);
            $this->assertSame($expected->nom, $item['fosaNom']);
            $this->assertSame($expected->nom, $item['fosa_nom']);
            $this->assertSame($expected->id, $item['fosaId']);
        }
        // equipebios + services + tmpfosa (+ auth / colonnes) : borné, indépendant du nombre de lignes
        $this->assertLessThanOrEqual(8, $queries);
    }

    public function test_equipebio_without_fosa_returns_null(): void
    {
        $batimentId = DB::table('batiments')->value('id');
        if (!$batimentId) {
            $this->markTestSkipped('Aucun bâtiment dans la copie.');
        }
        $now = now();
        $serviceId = DB::table('services')->insertGetId([
            'nom' => 'Service de test sans FOSA', 'batiment_id' => $batimentId, 'fosa_id' => null,
            'created_at' => $now, 'updated_at' => $now,
        ]);
        $equipId = DB::table('equipebios')->insertGetId([
            'nom' => 'Équipement de test', 'service_id' => $serviceId, 'quantite' => 1,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $response = $this->getJson("/api/v1/equipebios/{$equipId}", $this->authHeader());
        $response->assertOk()
            ->assertJsonPath('data.fosaNom', null)
            ->assertJsonPath('data.fosaId', null)
            ->assertJsonPath('data.fosa', null);
    }

    public function test_materielroulants_list_returns_the_owning_fosa(): void
    {
        if (DB::table('materielroulants')->count() === 0) {
            $this->markTestSkipped('Aucun véhicule dans la copie.');
        }
        $response = $this->getJson('/api/v1/materielroulants', $this->authHeader());
        $response->assertOk();

        foreach ($response->json('data') as $item) {
            $fosaId = DB::table('materielroulants')->where('id', $item['id'])->value('fosa_id');
            $this->assertSame($fosaId, $item['fosaId']);
            $this->assertSame(DB::table('tmpfosa')->where('id', $fosaId)->value('nom'), $item['fosaNom']);
        }
    }
}
