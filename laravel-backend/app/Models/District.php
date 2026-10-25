<?php

namespace App\Models;

use App\Models\Concerns\HasGeometry;
use Illuminate\Database\Eloquent\Model;

class District extends Model
{
    use HasGeometry;


    protected $fillable = ['nom_ds', 'code_ds', 'region', 'area', 'geom', 'region_id'];

    public function region() { return $this->belongsTo(Region::class); }
    public function airesantes() { return $this->hasMany(Airesante::class); }
}
