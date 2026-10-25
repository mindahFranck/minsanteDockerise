<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'resource', 'resource_id', 'details', 'ip_address', 'user_agent', 'status', 'error_message'];

    protected function casts(): array
    {
        return ['details' => 'array'];
    }

    public function user() { return $this->belongsTo(User::class); }
}
