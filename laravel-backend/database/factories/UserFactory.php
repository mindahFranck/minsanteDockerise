<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'role' => 'user',
            'scope_type' => 'national',
            'is_active' => true,
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(fn () => ['role' => 'super_admin']);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin']);
    }

    public function manager(): static
    {
        return $this->state(fn () => ['role' => 'manager', 'scope_type' => 'regional']);
    }
}
