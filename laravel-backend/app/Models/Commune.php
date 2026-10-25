<?php

namespace App\Models;

use App\Models\Concerns\HasGeometry;
use Illuminate\Database\Eloquent\Model;

class Commune extends Model
{
    use HasGeometry;


    protected $fillable = ['commune', 'departement_id', 'superficie', 'fit1', 'fit2', 'fit3', 'fit4', 'division', 'geom'];

    public function departement() { return $this->belongsTo(Departement::class); }
}
