<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipebio extends Model
{

    // `fonction` porte l'état de fonctionnement (la table n'a pas de colonne `etat`, voir EquipebioController).
    protected $fillable = ['nom', 'type', 'quantite', 'fonction', 'date_acquisition', 'service_id', 'description'];

    protected function casts(): array
    {
        return ['quantite' => 'integer', 'date_acquisition' => 'date'];
    }

    public function service() { return $this->belongsTo(Service::class); }
    public function fosa() { return $this->belongsTo(Fosa::class); }
}
