<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{

    protected $fillable = ['nom', 'responsable', 'date_creation', 'batiment_id', 'fosa_id', 'capacite', 'description'];

    protected function casts(): array
    {
        return ['date_creation' => 'date'];
    }

    public function batiment() { return $this->belongsTo(Batiment::class); }
    public function fosa() { return $this->belongsTo(Fosa::class); }
    public function personnels() { return $this->hasMany(Personnel::class); }
    public function equipements() { return $this->hasMany(Equipement::class); }
    public function equipebios() { return $this->hasMany(Equipebio::class); }
    public function materielroulants() { return $this->hasMany(Materielroulant::class); }
}
