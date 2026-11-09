<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipement extends Model
{

    protected $fillable = [
        'nom', 'type', 'date_acquisition', 'service_id', 'description',
        // Champs recommandation ImmoSanté
        'marque', 'modele', 'numero_serie', 'annee_fabrication', 'source_acquisition',
        'etat', 'contrat_maintenance', 'type_maintenance', 'date_derniere_maintenance',
        'date_prochaine_maintenance', 'duree_garantie', 'date_fin_garantie',
    ];

    protected function casts(): array
    {
        return [
            'date_acquisition' => 'date',
            'annee_fabrication' => 'integer',
            'contrat_maintenance' => 'boolean',
            'date_derniere_maintenance' => 'date',
            'date_prochaine_maintenance' => 'date',
            'date_fin_garantie' => 'date',
        ];
    }

    public function service() { return $this->belongsTo(Service::class); }
    public function fosa() { return $this->belongsTo(Fosa::class); }
}
