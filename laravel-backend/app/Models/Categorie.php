<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{

    protected $fillable = ['nom', 'type'];

    public function personnels() { return $this->hasMany(Personnel::class); }
}
