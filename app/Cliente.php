<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cliente extends Model
{
  use SoftDeletes;
	protected $fillable = [
        'nombre' ,
        'telefono',
        'chatbot_id',
        'direccion',
        'latitud',
        'longitud',
        'chatbot_id',
		'chatbot_status'
    ];

    public function pedidos()
    {
        return $this->hasMany(Pedido::class);
    }
}
