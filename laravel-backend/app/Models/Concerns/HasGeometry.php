<?php

namespace App\Models\Concerns;

trait HasGeometry
{
    public function scopeWithGeojson($query)
    {
        $table = $this->getTable();
        return $query->selectRaw("{$table}.*, ST_AsGeoJSON({$table}.geom) as geom_geojson");
    }
}
