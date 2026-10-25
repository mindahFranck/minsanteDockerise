<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function register(array $data): array
    {
        $user = User::create($data);
        $token = JWTAuth::fromUser($user);

        return ['user' => $user, 'token' => $token];
    }

    public function login(string $email, string $password): ?array
    {
        $user = User::where('email', $email)->first();

        if (!$user || !password_verify($password, $user->password)) {
            return null;
        }

        if (!$user->is_active) {
            return null;
        }

        $token = JWTAuth::fromUser($user);

        return [
            'user' => $user->load(['region', 'departement', 'arrondissement']),
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    public function refreshToken(): string
    {
        return JWTAuth::refresh(JWTAuth::getToken());
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): bool
    {
        if (!password_verify($currentPassword, $user->password)) {
            return false;
        }

        $user->update(['password' => $newPassword]);
        return true;
    }

    public function logout(): void
    {
        JWTAuth::invalidate(JWTAuth::getToken());
    }
}
