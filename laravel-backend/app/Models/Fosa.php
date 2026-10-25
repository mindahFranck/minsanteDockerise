<?php

namespace App\Models;

use App\Models\Concerns\HasGeometry;
use Illuminate\Database\Eloquent\Model;

class Fosa extends Model
{
    use HasGeometry;

    protected $table = 'tmpfosa';

    protected $fillable = [
        'nom', 'type', 'capacite_lits', 'est_ferme', 'situation', 'image',
        'org_unit', 'fonction', 'statut_rec', 'cat_rec', 'nom_directeur',
        'arrondissement_id', 'airesante_id', 'longitude', 'latitude', 'geom',
        'a_cloture', 'a_titre_foncier', 'connectee_electricite', 'type_courant',
        'last_inspection', 'next_inspection', 'maintenance_priority', 'maintenance_issues',
        'telephone', 'email', 'responsable_nom', 'responsable_telephone',
    ];

    protected function casts(): array
    {
        return [
            'capacite_lits' => 'integer',
            'est_ferme' => 'boolean',
            'fonction' => 'boolean',
            'a_cloture' => 'boolean',
            'a_titre_foncier' => 'boolean',
            'connectee_electricite' => 'boolean',
            'latitude' => 'float',
            'longitude' => 'float',
            'last_inspection' => 'date',
            'next_inspection' => 'date',
        ];
    }

    /**
     * Convertir en camelCase pour le frontend (comme l'ancien backend Node)
     */
    public function toArray()
    {
        // Retirer le binaire geom AVANT la sérialisation pour éviter le crash UTF-8
        unset($this->attributes['geom']);

        $array = parent::toArray();

        $camelMap = [
            'capacite_lits' => 'capaciteLits',
            'est_ferme' => 'estFerme',
            'cat_rec' => 'catRec',
            'statut_rec' => 'statutRec',
            'a_cloture' => 'aCloture',
            'a_titre_foncier' => 'aTitreFoncier',
            'connectee_electricite' => 'connecteeElectricite',
            'type_courant' => 'typeCourant',
            'org_unit' => 'orgUnit',
            'nom_directeur' => 'nomDirecteur',
            'responsable_nom' => 'responsableNom',
            'responsable_telephone' => 'responsableTelephone',
            'last_inspection' => 'lastInspection',
            'next_inspection' => 'nextInspection',
            'maintenance_priority' => 'maintenancePriority',
            'maintenance_issues' => 'maintenanceIssues',
            'arrondissement_id' => 'arrondissementId',
            'airesante_id' => 'airesanteId',
        ];

        // Supprimer le binaire geom qui crash le JSON
        unset($array['geom']);
        unset($array['geom_geojson']);

        foreach ($camelMap as $snake => $camel) {
            if (array_key_exists($snake, $array)) {
                $array[$camel] = $array[$snake];
                unset($array[$snake]);
            }
        }

        return $array;
    }

    public function arrondissement() { return $this->belongsTo(Arrondissement::class); }
    public function airesante() { return $this->belongsTo(Airesante::class); }
    public function batiments() { return $this->hasMany(Batiment::class); }
    public function services() { return $this->hasMany(Service::class); }
    public function personnels() { return $this->hasMany(Personnel::class); }
    public function equipements() { return $this->hasMany(Equipement::class); }
    public function equipebios() { return $this->hasMany(Equipebio::class); }
    public function materielroulants() { return $this->hasMany(Materielroulant::class); }
    public function parametres() { return $this->hasMany(Parametre::class); }

    public function scopeClosed($query) { return $query->where('est_ferme', true); }
    public function scopeFunctional($query) { return $query->where('est_ferme', false); }
    public function scopeByType($query, string $type) { return $query->where('type', $type); }
}
