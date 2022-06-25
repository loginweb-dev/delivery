<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Carrito extends Model
{
    protected $fillable = [
        'producto_id' ,
        'producto_name',
        'chatbot_id',
        'precio',
        'cantidad',
        'negocio_id',
        'negocio_name'
    ];
    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
