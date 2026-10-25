<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $fillable = [
        'email', 'password', 'first_name', 'last_name', 'role',
        'scope_type', 'region_id', 'departement_id', 'arrondissement_id', 'is_active',
        'last_login',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login' => 'datetime',
        ];
    }

    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return ['role' => $this->role, 'email' => $this->email]; }

    public function region() { return $this->belongsTo(Region::class); }
    public function departement() { return $this->belongsTo(Departement::class); }
    public function arrondissement() { return $this->belongsTo(Arrondissement::class); }
    public function roleModel() { return $this->belongsTo(Role::class, 'role', 'code'); }
    public function auditLogs() { return $this->hasMany(AuditLog::class); }

    public function scopeActive($query) { return $query->where('is_active', true); }
}
