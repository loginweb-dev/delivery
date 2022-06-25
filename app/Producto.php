<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
class Producto extends Model
{
        
	use SoftDeletes;

	public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function negocio()
    {
        return $this->belongsTo(Negocio::class, 'negocio_id');
    }

}
