<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Degradation extends Model
{

    protected $fillable = ['type'];

    public function batiments() { return $this->hasMany(Batiment::class); }
}
