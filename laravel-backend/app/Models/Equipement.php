<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipement extends Model
{

    protected $fillable = ['nom', 'type', 'date_acquisition', 'service_id', 'description'];

    protected function casts(): array
    {
        return ['date_acquisition' => 'date'];
    }

    public function service() { return $this->belongsTo(Service::class); }
    public function fosa() { return $this->belongsTo(Fosa::class); }
}
