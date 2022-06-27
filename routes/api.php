<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Negocio;
use App\Producto;
use App\Carrito;
use App\Pedido;
use App\PedidoDetalle;
use App\Pago;
use App\Cliente;
use App\Ubicacione;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// negocios
Route::get('negocios', function(){
    return Negocio::where('estado', true)->with('productos')->get();
});
Route::get('negocio/{id}', function($id){
    return Negocio::where('id', $id)->with('productos')->first();
});



Route::get('productos', function(){
    return Producto::with('categoria', 'negocio')->get();
    // return Producto::all();
});

Route::get('producto/{id}', function($id){
    return Producto::where('id',$id)->with('categoria', 'negocio')->first();
});

// SEARCH PRODUCTO
Route::post('chatbot/search', function (Request $request) {
    $result = Producto::where('nombre', 'like', '%'.$request->misearch.'%')->orWhere('detalle', 'like', '%'.$request->misearch.'%')->orderBy('nombre', 'desc')->with('categoria','negocio')->get();
    return $result;
});

Route::post('chatbot/cart/get', function (Request $request) {
    return Carrito::where('chatbot_id', $request->chatbot_id)->with('producto')->get();
});

//cart
Route::post('chatbot/cart/add', function (Request $request) {
    $item = Carrito::where('producto_id', $request->product_id)->where('chatbot_id', $request->chatbot_id)->first();
    // $cant = 0;
    if ($item) {
        $item->cantidad = $request->cantidad;
        $item->save();
        return  Carrito::where('producto_id', $request->product_id)->where('chatbot_id', $request->chatbot_id)->first();
    } else {
        // $cant = 1;
        $cart = Carrito::create([
            'producto_id' => $request->product_id,
            'producto_name' => $request->product_name,
            'chatbot_id' => $request->chatbot_id,
            'precio' => $request->precio,
            'cantidad' => $request->cantidad,
            'negocio_id' => $request->negocio_id,
            'negocio_name' =>$request->negocio_name
        ]);
        return $cart;
    }

});

Route::get('carrito/negocios/{chatbot_id}', function($chatbot_id){
    return Carrito::where('chatbot_id', $chatbot_id)->count('negocio_id');
});


Route::get('chatbot/pasarelas/get',function(){
    return Pago::where('view', 'frontend')->get();

});

// VENTAS
Route::post('chatbot/venta/save', function (Request $request) {
    $carts = Carrito::where('chatbot_id', $request->chatbot_id)->with('producto')->get();
    $newpedido = Pedido::create([
        'cliente_id' => $request->cliente_id,
        'pago_id' => $request->pago_id,
        'mensajero_id'=>1,
        'estado_id'=>1,
        'chatbot_id' => $request->chatbot_id,
        'ubicacion_id' => $request->ubicacion_id,
        'descuento' => 0,
        'total'=>$request->total
    ]);
    $mitotal = 0;
    foreach ($carts as $item) {
        PedidoDetalle::create([
            'producto_id' => $item->product_id,
            'pedido_id' =>  $newpedido->id,
            'precio'=> $item->precio,
            'cantidad' => $item->cantidad,
            'producto_name' => $item->product_name,
            'total' =>$item->precio * $item->cantidad
        ]);
        $mitotal += $item->precio * $item->cantidad;
    }
    $miupdate = Pedido::find($newpedido->id);
    $miupdate->total = $mitotal-($miupdate->descuento);
    $miupdate->save();
    Carrito::where('chatbot_id', $request->chatbot_id)->delete();
    return $newpedido;
});

Route::post('chatbot/cart/clean', function (Request $request) {
    return Carrito::where('chatbot_id', $request->chatbot_id)->delete();
});
Route::get('filtros/{negocio_id}', function ($negocio_id) {
    $result = Producto::where('negocio_id', $negocio_id )->orderBy('nombre', 'asc')->with('categoria','negocio')->get();
    return $result;
});

//clientes
Route::get('cliente/{phone}', function ($phone) {
    $micliente =  Cliente::where('chatbot_id', $phone)->with('pedidos')->first();
    if ($micliente) {
        return $micliente;
    } else {
        $newcliente = Cliente::create([
            'chatbot_id' => $phone
        ]);
        return $newcliente;
    }
});
Route::post('cliente/update', function (Request $request) {
    $cliente = Cliente::find($request->id);
    $cliente->nombre = $request->nombre;
    $cliente->save();
    $newcliente = Cliente::find($request->id);
    return $newcliente;
});


//ubicacion/save
Route::post('ubicacion/save', function (Request $request) {
    $ubicacion = Ubicacione::create([
        'latitud' => $request->latitud, //falta
        'longitud' =>  $request->longitud,
        'cliente_id'=> $request->cliente_id
    ]);
    return $ubicacion;
});
Route::post('ubicacion/update', function (Request $request) {
    $ubicacion = Ubicacione::find($request->id);
    $ubicacion->detalles = $request->detalle;
    $ubicacion->save();
    return $ubicacion;
});

//pedidos
Route::get('pedidos/{phone}', function ($phone) {
    return Pedido::where('chatbot_id', $phone)->with('estado', 'mensajero', 'productos')->get();

});