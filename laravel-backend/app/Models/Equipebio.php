<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipebio extends Model
{

    // `fonction` porte l'état de fonctionnement historique ; une colonne `etat`
    // dédiée a été ajoutée (recommandation ImmoSanté), voir EquipebioController.
    protected $fillable = [
        'nom', 'type', 'quantite', 'fonction', 'date_acquisition', 'service_id', 'description',
        // Champs recommandation ImmoSanté
        'marque', 'modele', 'numero_serie', 'annee_fabrication', 'source_acquisition',
        'etat', 'contrat_maintenance', 'type_maintenance', 'date_derniere_maintenance',
        'date_prochaine_maintenance', 'duree_garantie', 'date_fin_garantie', 'categorie_fosa',
    ];

    protected function casts(): array
    {
        return [
            'quantite' => 'integer',
            'date_acquisition' => 'date',
            'annee_fabrication' => 'integer',
            'contrat_maintenance' => 'boolean',
            'date_derniere_maintenance' => 'date',
            'date_prochaine_maintenance' => 'date',
            'date_fin_garantie' => 'date',
        ];
    }

    public function service() { return $this->belongsTo(Service::class); }

    /**
     * La table equipebios n'a pas de colonne fosa_id : la FOSA propriétaire est
     * celle du service (equipebio -> service -> fosa). Charger `service.fosa`.
     */
    public function fosa()
    {
        return $this->hasOneThrough(Fosa::class, Service::class, 'id', 'id', 'service_id', 'fosa_id');
    }
}
