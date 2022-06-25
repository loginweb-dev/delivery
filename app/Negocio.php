<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
class Negocio extends Model
{
    
	use SoftDeletes;

	public function productos()
    {
        return $this->hasMany(Producto::class);
    }
}
