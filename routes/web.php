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

Route::get('mispedidos/{chatbot_id}', function ($chatbot_id) {
    $mipedidos = App\Pedido::where('chatbot_id', $chatbot_id)->orderBy('created_at', 'desc')->get();
    return view('mispedidos', compact('mipedidos'));
});


Route::group(['prefix' => 'admin'], function () {
    Voyager::routes();
});
