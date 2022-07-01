<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
class Mensajero extends Model
{
    use SoftDeletes;

    public function pedidos()
    {
        return $this->belongsTo(Pedido::class, 'id');
    }
}
