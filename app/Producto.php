<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use TCG\Voyager\Traits\Resizable;
use Carbon\Carbon;
class Producto extends Model
{
        
	use SoftDeletes;
    use Resizable;

    protected $appends=['published', 'fecha'];
    public function getPublishedAttribute(){
      return Carbon::createFromTimeStamp(strtotime($this->attributes['created_at']) )->diffForHumans();
    }
    public function getFechaAttribute(){
      return date('Y-m-d', strtotime($this->attributes['created_at']));
    }

	  public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }
    public function negocio()
    {
        return $this->belongsTo(Negocio::class, 'negocio_id');
    }
    public function precios()
    {
        return $this->hasMany(RelProductoPrecio::class);
    }

}
