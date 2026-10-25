<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Personnel extends Model
{

    protected $fillable = ['nom', 'prenom', 'matricule', 'grade', 'fosa_id', 'categorie_id'];

    public function fosa() { return $this->belongsTo(Fosa::class); }
    public function categorie() { return $this->belongsTo(Categorie::class); }
    public function service() { return $this->belongsTo(Service::class); }
}
