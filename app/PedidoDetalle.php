<?php

namespace App;

use Illuminate\Database\Eloquent\Model;


class PedidoDetalle extends Model
{
    protected $fillable = [
        'producto_id',
        'pedido_id',
        'precio',
        'cantidad',
        'producto_name',
        'total'
    ];

}
