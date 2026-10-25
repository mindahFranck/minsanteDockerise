<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed');
    }

    private function getTokenFor(string $email): string
    {
        $user = User::where('email', $email)->first();
        return auth('api')->login($user);
    }

    public function test_super_admin_can_create_user(): void
    {
        $token = $this->getTokenFor('superadmin@minsante.cm');

        $response = $this->postJson('/api/v1/users', [
            'email' => 'newuser@test.cm',
            'password' => 'password123',
            'first_name' => 'New',
            'last_name' => 'User',
            'role' => 'user',
            'scope_type' => 'national',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertStatus(201);
    }

    public function test_admin_cannot_create_user(): void
    {
        $token = $this->getTokenFor('admin@minsante.cm');

        $response = $this->postJson('/api/v1/users', [
            'email' => 'newuser@test.cm',
            'password' => 'password123',
            'first_name' => 'New',
            'last_name' => 'User',
            'role' => 'user',
            'scope_type' => 'national',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertStatus(403);
    }

    public function test_regular_user_cannot_access_audit(): void
    {
        $token = $this->getTokenFor('user@minsante.cm');

        $response = $this->getJson('/api/v1/audit/activity', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_access_audit(): void
    {
        $token = $this->getTokenFor('admin@minsante.cm');

        $response = $this->getJson('/api/v1/audit/activity', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200);
    }

    public function test_health_check_requires_no_auth(): void
    {
        $response = $this->getJson('/api/health');
        $response->assertStatus(200)->assertJsonPath('data.status', 'healthy');
    }

    public function test_health_live_always_returns_ok(): void
    {
        $response = $this->getJson('/api/health/live');
        $response->assertStatus(200)->assertJsonPath('data.status', 'alive');
    }
}
