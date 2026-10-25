<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Materielroulant extends Model
{

    protected $fillable = [
        'numero_chassis', 'annee', 'marque', 'modele', 'type',
        'date_mise_en_circulation', 'etat', 'quantite', 'fosa_id',
        'date_mise_service', 'acte_affectation', 'type_vehicule',
        'immatriculation', 'usage', 'code', 'structure', 'service_id',
        'nom_utilisateur', 'fonction_utilisateur', 'energie', 'financement',
    ];

    protected function casts(): array
    {
        return [
            'annee' => 'integer',
            'quantite' => 'integer',
            'date_mise_en_circulation' => 'date',
            'date_mise_service' => 'date',
        ];
    }

    public function fosa() { return $this->belongsTo(Fosa::class); }
    public function service() { return $this->belongsTo(Service::class); }
}
