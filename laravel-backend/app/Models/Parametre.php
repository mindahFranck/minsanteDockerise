<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Parametre extends Model
{

    protected $fillable = ['nombre_patients_ambulants', 'nombre_patients_totaux', 'liste_operationnelle', 'date', 'fosa_id'];

    protected function casts(): array
    {
        return [
            'nombre_patients_ambulants' => 'integer',
            'nombre_patients_totaux' => 'integer',
            'date' => 'date',
        ];
    }

    public function fosa() { return $this->belongsTo(Fosa::class); }
}
