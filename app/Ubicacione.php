<?php

namespace App;

use Illuminate\Database\Eloquent\Model;


class Ubicacione extends Model
{
	protected $fillable = [
        'latitud',
        'longitud',
        'cliente_id',
        'detalles'
    ];
}
