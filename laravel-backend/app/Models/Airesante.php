<?php

namespace App\Models;

use App\Models\Concerns\HasGeometry;
use Illuminate\Database\Eloquent\Model;

class Airesante extends Model
{
    use HasGeometry;


    protected $fillable = ['nom_as', 'nom_dist', 'code_as', 'area', 'geom', 'district_id'];

    public function district() { return $this->belongsTo(District::class); }
    public function fosas() { return $this->hasMany(Fosa::class); }
}
