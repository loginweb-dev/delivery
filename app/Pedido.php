<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
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
        'ubicacion_id',
        'estado_id'
    ];

	protected $appends=['published', 'fecha'];
	public function getPublishedAttribute(){
		return Carbon::createFromTimeStamp(strtotime($this->attributes['created_at']) )->diffForHumans();
	}
	public function getFechaAttribute(){
		return date('Y-m-d', strtotime($this->attributes['created_at']));
	}
    public function estado()
    {
        return $this->belongsTo(Estado::class, 'estado_id');
    }
    public function mensajero()
    {
        return $this->belongsTo(Mensajero::class, 'mensajero_id');
    }
    public function productos()
    {
        return $this->hasMany(PedidoDetalle::class);
    }
}
