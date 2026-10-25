<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RoleSeeder']);
    }

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'first_name' => 'Test',
            'last_name' => 'User',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['success', 'data' => ['user', 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
    }

    public function test_user_cannot_register_with_invalid_email(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'invalid-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'first_name' => 'Test',
            'last_name' => 'User',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_login(): void
    {
        User::factory()->create([
            'email' => 'login@example.com',
            'password' => 'password123',
            'role' => 'user',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'login@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data' => ['user', 'token', 'token_type', 'expires_in']]);
    }

    public function test_user_cannot_login_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'wrong@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'wrong@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $token = auth('api')->login($user);

        $response = $this->getJson('/api/v1/auth/me', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/v1/auth/me');
        $response->assertStatus(401);
    }

    public function test_user_can_change_password(): void
    {
        $user = User::factory()->create([
            'password' => 'oldpassword',
            'role' => 'user',
        ]);
        $token = auth('api')->login($user);

        $response = $this->putJson('/api/v1/auth/password', [
            'current_password' => 'oldpassword',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ], ['Authorization' => "Bearer {$token}"]);

        $response->assertStatus(200);
    }
}
