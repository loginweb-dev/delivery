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
use App\Mensajero;
use App\Comentario;
use App\Poblacione;
use App\Banipay;
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
Route::get('negocios/{poblacion_id}', function($poblacion_id){
    return Negocio::where('estado', true)->where('poblacion_id', $poblacion_id)->with('productos')->get();
});
Route::get('negocio/{id}', function($id){
    return Negocio::where('id', $id)->with('productos')->first();
});
Route::get('minegocio/{phone}', function($phone){
    return Negocio::where('chatbot_id', $phone)->with('productos', 'poblacion')->first();
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

Route::get('pedido/negocios/{id}', function($id){
    return PedidoDetalle::where('pedido_id', $id)->with('negocio')->get();
});

Route::get('pedido/carrito/negocios/{chatbot_id}', function($chatbot_id){
    $carrito=Carrito::where('chatbot_id', $chatbot_id)->with('negocio')->get();
    $vec1=[];
    $index=0;
    foreach ($carrito as $item) {
        $vec1[$index]=$item->negocio->id;
        $index+=1;
    }
    $cant=array_count_values($vec1);

    $contador=0;
    foreach ($cant as $item) {
        $contador+=1;
    }
    return $contador;
});

Route::get('chatbot/pasarelas/get',function(){
    return Pago::where('view', 'frontend')->get();

});

// VENTAS
Route::post('pedido/save', function (Request $request) {
    $carts = Carrito::where('chatbot_id', $request->chatbot_id)->with('producto')->get();
    $newpedido = Pedido::create([
        'cliente_id' => $request->cliente_id,
        'pago_id' => $request->pago_id,
        'mensajero_id'=>1,
        'estado_id'=>1,
        'chatbot_id' => $request->chatbot_id,
        'ubicacion_id' => $request->ubicacion_id,
        'descuento' => 0,
        'total'=>0
    ]);
    $mitotal = 0;
    foreach ($carts as $item) {
        PedidoDetalle::create([
            'producto_id' => $item->producto_id,
            'pedido_id' =>  $newpedido->id,
            'precio'=> $item->precio,
            'cantidad' => $item->cantidad,
            'producto_name' => $item->producto_name,
            'total' =>$item->precio * $item->cantidad,
            'negocio_name'=> $item->negocio_name,
            'negocio_id'=> $item->negocio_id
        ]);
        $mitotal += $item->precio * $item->cantidad;
    }
    $miupdate = Pedido::find($newpedido->id);
    $miupdate->total = $mitotal-($miupdate->descuento);
    $miupdate->save();
    Carrito::where('chatbot_id', $request->chatbot_id)->delete();
    $lastpedido = Pedido::where('id', $newpedido->id)->with('cliente', 'productos', 'ubicacion', 'mensajero', 'banipay')->first();
    return $lastpedido;
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
    $micliente =  Cliente::where('chatbot_id', $phone)->with('pedidos', 'ubicaciones', 'localidad')->first();
    if ($micliente) {
        return $micliente;
    } else {
        $newcliente = Cliente::create([
            'chatbot_id' => $phone
        ]);
        return $newcliente;
    }
});
Route::post('cliente/update/nombre', function (Request $request) {
    $cliente = Cliente::find($request->id);
    $cliente->nombre = $request->nombre;
    $cliente->save();
    $newcliente = Cliente::find($request->id);
    return $newcliente;
});

Route::post('cliente/update/localidad', function (Request $request) {
    $cliente = Cliente::find($request->id);
    $cliente->poblacion_id = $request->poblacion_id;
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
    return Pedido::where('chatbot_id', $phone)->orderBy('created_at', 'desc')->with('estado', 'mensajero', 'productos')->get();

});

//Mensajeros libres
Route::get('mensajeros/libre', function(){
    return Mensajero::where('estado', 1)->get();
});

//Negocios del Pedido
Route::get('negocios/pedido/{midata}', function($midata){
    return Pedido::where('id', $midata)->with('productos')->first();
});

//Buscar Pedido con Cliente
 Route::get('pedido/{id}', function($id){
    return Pedido::where('id', $id)->with('cliente', 'productos', 'ubicacion', 'mensajero', 'banipay')->first();
 });

 //Asignar Pedido a Mensajero
 Route::post('asignar/pedido', function(Request $request){
    $mensajero=Mensajero::where('telefono', $request->telefono)->first();
    $pedido= Pedido::find($request->pedido_id);
    if(($pedido->estado_id) ==1 || ($pedido->estado_id)==6){
        $pedido->estado_id=2;
        $pedido->mensajero_id= $mensajero->id;
        $pedido->save();
        $mensajero->estado=0;
        $mensajero->save();
        return true;
    }
    else{
        return false;
    }    
 });
 //Cancelar Pedido de parte del Mensajero
 Route::post('cancelar/pedido', function(Request $request){
    $mensajero=Mensajero::where('telefono', $request->telefono)->first();
    if ($mensajero==null) {
        return false;
    }
    $pedido=Pedido::where('estado_id', 2)->where('mensajero_id', $mensajero->id)->with('cliente', 'productos', 'ubicacion', 'mensajero')->first();
    if($pedido!= null){
        $pedido->estado_id=6;
        $pedido->mensajero_id= 1;
        $pedido->save();
        $mensajero->estado=1;
        $mensajero->save();
        return $pedido;
    }
    else{
        return false;
    }    
 });
 Route::get('mensajero/{phone}', function ($phone) {
    $mimensajero =  Mensajero::where('telefono', $phone)->with('pedidos', 'localidad')->first();
    if ($mimensajero) {
        return $mimensajero;
    } else {
        // $mimensajero = Mensajero::create([
        //     'telefono' => $phone
        // ]);
        return false;
    }
});

//Mensajero por ID
Route::get('search/mensajero/{id}', function($id){
    return Mensajero::find($id);
});
Route::get('mensajero/update/{phone}', function($phone){
    $mimsg =  Mensajero::where('telefono', $phone)->with('pedidos')->first();
    $mimsg->estado = $mimsg->estado ? false : true;
    $mimsg->save();
    return Mensajero::where('telefono', $phone)->with('pedidos')->first();
});
Route::get('mensajero/pedidos/{phone}', function($phone){
    $mimsg =  Mensajero::where('telefono', $phone)->with('pedidos')->first();
    $pedidos = Pedido::where('mensajero_id', $mimsg->id)->with('productos', 'cliente', 'pasarela', 'estado')->get();
    return $pedidos;
});

//Estado del Pedido Llevando
Route::get('llevando/pedido/{id}', function($id){
    $pedido= Pedido::where('id', $id)->with('cliente', 'productos', 'ubicacion', 'mensajero')->first();
    $pedido->estado_id=3;
    $pedido->save();
    return $pedido;
});

//Estado del Pedido Entregado
Route::get('entregando/pedido/{id}', function($id){
    $pedido= Pedido::where('id', $id)->with('cliente', 'productos', 'ubicacion', 'mensajero')->first();
    $pedido->estado_id=4;
    $pedido->save();
    $mensajero=Mensajero::find($pedido->mensajero_id);
    $mensajero->estado=1;
    $mensajero->save();
    return $pedido;
});

//Añadir Queja o Sugerencia del Pedido
Route::post('pedido/comentario', function(Request $request){
    $pedido= Pedido::where('chatbot_id', $request->telefono)->orderBy('created_at', 'desc')->first();
    if ($pedido) {
        $newcliente = Comentario::create([
            'pedido_id' => $pedido->id,
            'description' => $request->description
        ]);
        $pedido_comentado= Pedido::where('id', $pedido->id)->with('cliente', 'productos', 'ubicacion', 'mensajero', 'comentario')->first();
    }
    return $pedido_comentado;
});

//poblaciones
Route::get('poblaciones', function(){
    return Poblacione::orderBy('created_at', 'desc')->get();
});



//APIS PARA BACKEND

//Todos los Pedidos entre fechas
Route::get('fecha/doble/pedidos/{midata}', function($midata){
    $midata2= json_decode($midata);
        return Pedido::whereBetween('created_at', [$midata2->date1, $midata2->date2])->with('cliente', 'productos', 'ubicacion', 'mensajero')->get();
});

// //Todos los Pedidos en una fecha
// Route::get('fecha/unica/pedidos/{midata}', function($midata){
//     $midata2= json_decode($midata);
//     return Pedido::where('created_at', $midata2->date1)->with('cliente', 'productos', 'ubicacion', 'mensajero')->get();
// });

//Todos los Negocios
Route::get('all/negocios', function(){
    return Negocio::all();
});
Route::get('negocio/update/{phone}', function($phone){
    $mimsg =  Negocio::where('chatbot_id', $phone)->with('productos', 'poblacion')->first();
    // return $mimsg;
    $mimsg->estado = $mimsg->estado ? false : true;
    $mimsg->save();
    return Negocio::where('chatbot_id', $phone)->with('productos', 'poblacion')->first();
});

//banipay
Route::post('banipay/save', function(Request $request) {
    $banipay = Banipay::create([
        'pedido_id' => $request->externalCode,
        'paymentId' => $request->paymentId,
        'transactionGenerated' => $request->transactionGenerated,
        'urlTransaction' => '?t='.$request->transactionGenerated.'&p='.$request->paymentId
    ]);
    return $banipay;
});