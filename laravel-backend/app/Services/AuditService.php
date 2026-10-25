<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditService
{
    public function log(?User $user, string $action, string $resource, ?int $resourceId, array $details, Request $request, string $status = 'success', ?string $errorMessage = null): AuditLog
    {
        return AuditLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'resource' => $resource,
            'resource_id' => $resourceId,
            'details' => $details,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => $status,
            'error_message' => $errorMessage,
        ]);
    }

    public function logLogin(User $user, Request $request): AuditLog
    {
        return $this->log($user, 'login', 'auth', null, ['email' => $user->email], $request);
    }

    public function logLoginFailure(string $email, Request $request): AuditLog
    {
        return $this->log(null, 'login', 'auth', null, ['email' => $email], $request, 'failure', 'Identifiants invalides');
    }

    public function logCreate(?User $user, string $resource, int $resourceId, array $data, Request $request): AuditLog
    {
        return $this->log($user, 'create', $resource, $resourceId, ['after' => $data], $request);
    }

    public function logUpdate(?User $user, string $resource, int $resourceId, array $before, array $after, Request $request): AuditLog
    {
        return $this->log($user, 'update', $resource, $resourceId, ['before' => $before, 'after' => $after], $request);
    }

    public function logDelete(?User $user, string $resource, int $resourceId, array $data, Request $request): AuditLog
    {
        return $this->log($user, 'delete', $resource, $resourceId, ['before' => $data], $request);
    }

    public function getUserHistory(int $userId, array $filters = [], int $perPage = 15)
    {
        $query = AuditLog::where('user_id', $userId);

        if (!empty($filters['resource'])) $query->where('resource', $filters['resource']);
        if (!empty($filters['action'])) $query->where('action', $filters['action']);

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function getResourceHistory(string $resource, int $resourceId, int $perPage = 15)
    {
        return AuditLog::where('resource', $resource)
            ->where('resource_id', $resourceId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function getRecentActivity(array $filters = [], int $perPage = 15)
    {
        $query = AuditLog::with('user');

        if (!empty($filters['resource'])) $query->where('resource', $filters['resource']);
        if (!empty($filters['action'])) $query->where('action', $filters['action']);
        if (!empty($filters['user_id'])) $query->where('user_id', $filters['user_id']);
        if (!empty($filters['date_from'])) $query->whereDate('created_at', '>=', $filters['date_from']);
        if (!empty($filters['date_to'])) $query->whereDate('created_at', '<=', $filters['date_to']);

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }
}
