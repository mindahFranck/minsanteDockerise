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
        'specifications', 'quantite_standard', 'prix_unitaire',
    ];
}
