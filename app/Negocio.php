<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
class Negocio extends Model
{
    
	use SoftDeletes;
    // protected $fillable = [
    //     'nombre',
    //     'direccion',
    //     'problacion_id'
    // ];
	public function productos()
    {
        return $this->hasMany(Producto::class);
    }
    public function poblacion()
    {
        return $this->belongsTo(Poblacione::class, 'poblacion_id');
    }
}
