<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Entrée du catalogue d'équipements standard par catégorie de FOSA (référence).
 */
class EquipementStandard extends Model
{
    protected $table = 'equipements_standard';

    protected $fillable = [
        'categorie_fosa', 'service', 'code', 'designation',
        'specifications', 'quantite_standard', 'prix_unitaire', 'famille',
    ];

    /**
     * Famille d'un équipement d'après sa section/service :
     * 'autre' (non biomédical) pour le mobilier, le bureau, la logistique, la
     * buanderie, la morgue, la maintenance, l'épuration et les gaz ; 'bio'
     * (biomédical) pour tout le reste (consultations, labo, bloc, imagerie,
     * spécialités médicales…).
     */
    public static function familleFromService(?string $service): string
    {
        $s = strtolower($service ?? '');
        $s = strtr($s, ['é' => 'e', 'è' => 'e', 'ê' => 'e', 'à' => 'a', 'î' => 'i', 'ï' => 'i', 'ô' => 'o', 'û' => 'u', 'ç' => 'c']);
        foreach (['bureau', 'logistique', 'buanderie', 'mobilier', 'morgue', 'maintenance', 'epuration', 'gaz'] as $kw) {
            if (str_contains($s, $kw)) {
                return 'autre';
            }
        }
        return 'bio';
    }
}
