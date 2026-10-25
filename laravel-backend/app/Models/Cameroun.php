<?php

namespace App\Models;

use App\Models\Concerns\HasGeometry;
use Illuminate\Database\Eloquent\Model;

class Cameroun extends Model
{
    use HasGeometry;


    protected $table = 'cameroun';
    protected $fillable = ['forme', 'geom'];
}
