<?php

namespace App\Models;

use App\Models\Concerns\HasGeometry;
use Illuminate\Database\Eloquent\Model;

class Departement extends Model
{
    use HasGeometry;


    protected $fillable = ['departement', 'region_id', 'fit1', 'fit2', 'fit3', 'fit4', 'geom'];

    protected function casts(): array
    {
        return ['fit1' => 'float', 'fit2' => 'float', 'fit3' => 'float', 'fit4' => 'float'];
    }

    public function region() { return $this->belongsTo(Region::class); }
    public function arrondissements() { return $this->hasMany(Arrondissement::class); }
    public function communes() { return $this->hasMany(Commune::class); }
}
