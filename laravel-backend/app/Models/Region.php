<?php

namespace App\Models;

use App\Models\Concerns\HasGeometry;
use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    use HasGeometry;


    protected $fillable = ['nom', 'capitale', 'population', 'latitude', 'longitude', 'geom'];

    protected function casts(): array
    {
        return ['population' => 'integer', 'latitude' => 'float', 'longitude' => 'float'];
    }

    public function departements() { return $this->hasMany(Departement::class); }
    public function districts() { return $this->hasMany(District::class); }
}
