<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/nosotros', function () {
    return view('welcome');
});

Route::get('/marketplace', function () {
    return view('markplace');
});

Route::get('mensajero/{chatbot_id}', function ($chatbot_id) {
    $mipedidos = App\Pedido::where('mensajero_id', $chatbot_id)->orderBy('created_at', 'desc')->get();
    return view('misviajes', compact('mipedidos'));
});

Route::get('negocio/{slug}', function ($slug) {
    $negocio = App\Negocio::where('slug', $slug)->with('productos')->first();
    return view('minegocio', compact('negocio')); 
})->name('negocio');

Route::get('producto/{id}', function ($id) {
    $producto = App\Producto::where('id', $id)->first();
    return view('producto', compact('producto')); 
})->name('producto');

Route::get('cliente/{phone}', function ($phone) {
    $pedidos = App\Negocio::where('chatbot_id', $phone)->first();
    return view('mispedidos', compact('pedidos')); 
});

Route::group(['prefix' => 'admin'], function () {
    Voyager::routes();
    Route::get('/mispedidos/{id}', function ($id) {
        $negocio= App\Negocio::find($id);
        return view('pedidos.mipedidos', compact('negocio'));
    })->name('mispedidos');
    Route::get('pedidos/midetalle/{id}', function ($id) {
        // $detalle= App\PedidoDetalle::where('pedido_id', $id)->with('negocio', 'extras')->get();
        
        return view('detalles.midetalle', compact('id'));
    })->name('midetalle');
});

