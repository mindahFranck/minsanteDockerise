<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Batiment extends Model
{

    protected $fillable = ['nom', 'type', 'etat', 'fosa_id', 'degradation_id', 'superficie', 'anne_construction', 'description'];

    public function fosa() { return $this->belongsTo(Fosa::class); }
    public function degradation() { return $this->belongsTo(Degradation::class); }
    public function services() { return $this->hasMany(Service::class); }
}
