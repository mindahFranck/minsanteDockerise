<?php

namespace App\Models;

use App\Models\Concerns\HasGeometry;
use Illuminate\Database\Eloquent\Model;

class Arrondissement extends Model
{
    use HasGeometry;


    protected $fillable = ['nom', 'superficie', 'fit1', 'fit2', 'fit3', 'fit4', 'division', 'geom', 'departement_id'];

    public function departement() { return $this->belongsTo(Departement::class); }
    public function fosas() { return $this->hasMany(Fosa::class); }
}
