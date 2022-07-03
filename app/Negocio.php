<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;
class Negocio extends Model
{
    
	use SoftDeletes;
    // protected $fillable = [
    //     'nombre',
    //     'direccion',
    //     'problacion_id'
    // ];

    protected $appends=['published', 'fecha'];
    public function getPublishedAttribute(){
      return Carbon::createFromTimeStamp(strtotime($this->attributes['created_at']) )->diffForHumans();
    }
    public function getFechaAttribute(){
      return date('Y-m-d', strtotime($this->attributes['created_at']));
    }
    
	public function productos()
    {
        return $this->hasMany(Producto::class);
    }
    public function poblacion()
    {
        return $this->belongsTo(Poblacione::class, 'poblacion_id');
    }
}
