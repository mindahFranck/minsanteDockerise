<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Fosa;
use App\Models\Region;
use App\Models\Departement;
use App\Models\Arrondissement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FosaTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed');

        $this->admin = User::where('email', 'superadmin@minsante.cm')->first();
        $this->token = auth('api')->login($this->admin);
    }

    private function authHeader(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_can_list_fosas(): void
    {
        $response = $this->getJson('/api/v1/fosas', $this->authHeader());
        $response->assertStatus(200)->assertJsonStructure(['success', 'data', 'pagination']);
    }

    public function test_can_create_fosa(): void
    {
        $region = Region::create(['nom' => 'Centre']);
        $dept = Departement::create(['nom' => 'Mfoundi', 'region_id' => $region->id]);
        $arr = Arrondissement::create(['nom' => 'Yaoundé 1', 'departement_id' => $dept->id]);

        $response = $this->postJson('/api/v1/fosas', [
            'nom' => 'Hôpital Central',
            'type' => 'Hôpital',
            'arrondissement_id' => $arr->id,
            'airesante_id' => null,
            'capacite_lits' => 200,
        ], $this->authHeader());

        $response->assertStatus(201);
        $this->assertDatabaseHas('fosas', ['nom' => 'Hôpital Central']);
    }

    public function test_can_get_fosa_details(): void
    {
        $fosa = Fosa::create([
            'nom' => 'Test FOSA',
            'type' => 'CSI',
        ]);

        $response = $this->getJson("/api/v1/fosas/{$fosa->id}", $this->authHeader());
        $response->assertStatus(200)->assertJsonPath('data.nom', 'Test FOSA');
    }

    public function test_can_get_closed_fosas(): void
    {
        Fosa::create(['nom' => 'Fermé', 'type' => 'CSI', 'est_ferme' => true]);
        Fosa::create(['nom' => 'Ouvert', 'type' => 'CSI', 'est_ferme' => false]);

        $response = $this->getJson('/api/v1/fosas/closed', $this->authHeader());
        $response->assertStatus(200);
    }

    public function test_can_get_fosas_by_type(): void
    {
        Fosa::create(['nom' => 'Hop1', 'type' => 'Hôpital']);
        Fosa::create(['nom' => 'CSI1', 'type' => 'CSI']);

        $response = $this->getJson('/api/v1/fosas/type/Hôpital', $this->authHeader());
        $response->assertStatus(200);
    }

    public function test_can_get_map_data(): void
    {
        Fosa::create(['nom' => 'Map FOSA', 'type' => 'CSI', 'latitude' => 3.8, 'longitude' => 11.5]);

        $response = $this->getJson('/api/v1/fosas/map/all', $this->authHeader());
        $response->assertStatus(200);
    }

    public function test_regular_user_cannot_create_fosa(): void
    {
        $user = User::where('email', 'user@minsante.cm')->first();
        $token = auth('api')->login($user);

        $response = $this->postJson('/api/v1/fosas', [
            'nom' => 'Test',
            'type' => 'CSI',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertStatus(403);
    }

    public function test_can_delete_fosa(): void
    {
        $fosa = Fosa::create(['nom' => 'Delete Me', 'type' => 'CSI']);

        $response = $this->deleteJson("/api/v1/fosas/{$fosa->id}", [], $this->authHeader());
        $response->assertStatus(200);
        $this->assertDatabaseMissing('fosas', ['id' => $fosa->id]);
    }
}
