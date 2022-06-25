<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
class Pedido extends Model
{
    	use SoftDeletes;
    protected $fillable = [
        'cliente_id',
        'pago_id',
        'mensajero_id',
        'chatbot_id',
        'descuento',
        'total',
        'ubicacion_id'
    ];


}
