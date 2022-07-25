@extends('master')
@section('content')
	
@php
	$image=$producto->image ? $producto->image : setting('productos.img_default_producto');
@endphp
<div class="card">
	<div class="row no-gutters">
		<aside class="col-sm-5 border-right">
<article class="gallery-wrap"> 
<div class="img-big-wrap">
	<br>
  {{-- <div> <a href="images/items/1.jpg" data-fancybox=""><img src="images/items/1.jpg"></a></div> --}}
  {{-- <div class="img-wrap"><img  src="{{ Voyager::image($producto->thumbnail('cropped', 'image')) }}"></a></div> --}}
  <div class="img-wrap"><img src="{{setting('admin.url')}}storage/{{$image}}" alt=""></div>
  {{-- <div class="img-wrap"><img src="{{setting('admin.url')}}storage/{{setting('productos.img_default_producto')}}" alt=""></div> --}}


</div> <!-- slider-product.// -->
{{-- <div class="img-small-wrap">
  <div class="item-gallery"> <img src="images/items/1.jpg"></div>
  <div class="item-gallery"> <img src="images/items/2.jpg"></div>
  <div class="item-gallery"> <img src="images/items/3.jpg"></div>
  <div class="item-gallery"> <img src="images/items/4.jpg"></div>
</div> <!-- slider-nav.// --> --}}
</article> <!-- gallery-wrap .end// -->
		</aside>
		<aside class="col-sm-7">
<article class="p-5">
	<h3 class="title mb-3">{{$producto->nombre}}</h3>

<div class="mb-3"> 
	
    @if ($producto->precio > 0)
      <var class="price h3 text-primary"> 
		    <span class="currency"></span><span class="num">{{$producto->precio}} Bs.</span>
      </var> 
    @else
      @php
        $rel=App\RelProductoPrecio::where('producto_id', $producto->id)->get();
      @endphp 
        @foreach ($rel as $item2)
          @php
            $precio_prod= App\Precio::find( $item2->precio_id);
          @endphp
          <var class="price h5 text-primary"> 
            <span class="currency"></span><span class="num">{{ $precio_prod->nombre }} {{ $precio_prod->precio }} Bs.</span><br>
          </var>
        @endforeach
    @endif

</div> 
<dl>
  <dt>Descripción</dt>
  <dd><p>{{$producto->detalle}}. </p></dd>
</dl>

<div class="rating-wrap">

	<ul class="rating-stars">
		<li style="width:80%" class="stars-active"> 
			<i class="fa fa-star"></i> <i class="fa fa-star"></i> 
			<i class="fa fa-star"></i> <i class="fa fa-star"></i> 
			<i class="fa fa-star"></i> 
		</li>
		<li>
			<i class="fa fa-star"></i> <i class="fa fa-star"></i> 
			<i class="fa fa-star"></i> <i class="fa fa-star"></i> 
			<i class="fa fa-star"></i> 
		</li>
	</ul>
	<div class="label-rating">132 reviews</div>
	<div class="label-rating">154 orders </div>
</div> 
<hr>
<dl>
	<dt>Información</dt>
	<dd>
		<p>Si desea agregar extras distintos a cada producto, agréguelos al carrito individualmente porfavor, esto es para distinguir que extras van en cada producto. </p>
	</dd>
</dl>
<hr>
  <div class="col-sm-6">
    <dt>Cantidad: </dt>
    <dd> 
    <input class="form-control" type="number" id="cantidad_producto" min="1" value="1">			  
    </dd>
    <dt hidden>Subtotal Producto: </dt>
    <dd>
      <input readonly id="subtotal_producto" type="number" hidden>
      <input id="precio_producto" type="number" hidden>
    </dd>
  </div>
  <div class="col-sm-6" id="op_producto" hidden>
    <dt>Opción: </dt>
    <dd> 
      <select class="form-control" name="opciones_producto" id="opciones_producto"></select>
    </dd>
  </div>
	
	<div class="col-sm-6" id="extras_opciones" class="row" hidden>
    <dt>Extras: </dt>
    <dd>
      <div class="input-group-append">

      <input class="form-control" id="texto_extras" readonly type="text">
      <button   class="btn btn-sm btn-success"  data-toggle="modal" data-target="#modal-lista_extras" onclick="addextra('{{$producto->negocio_id}}','{{$producto->id}}')"> <i class="fa fa-plus-square-o"></i></button>
      </div>
    </dd>
    <dt hidden>Subtotal Extras: </dt>
    <dd>
      <input id="subtotal_extras" readonly type="number"  value="0" hidden>
    </dd>
	</div>
	
  <div class="col-sm-6">
    <span><b>Total:</b></span>
	  <input class="form-control"  id="total_producto" readonly type="number">

  </div>
	

	<hr>
	<a onclick="agregar_carrito('{{$producto->id}}')" class="btn  btn-outline-primary"> <i class="fas fa-shopping-cart"></i> Agregar a Carrito </a>
</article> 
		</aside>
	</div> 
</div> 

<div class="modal modal-primary fade" tabindex="-1" id="modal-lista_extras" role="dialog">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h4 class="modal-title"><i class="voyager-list-add"></i> Lista de extras</h4>
			</div>
			<div class="modal-body">
				<input type="text" name="producto_extra_id" id="producto_extra_id" hidden>
				<input type="text" name="tr_producto" id="tr_producto" hidden>
  
				<table class="table table-bordered table-hover" id="table-extras">
					<thead>
						<tr>
							{{-- <th>Imagen</th> --}}
							<th hidden>ID</th>
							<th>Extra</th>
							<th>Precio</th>
							<th>Cantidad</th>
						</tr>
					</thead>
					<tbody>
					</tbody>
				</table>
				{{-- <td style="text-align: right">
					<input style="text-align:right" readonly min="0" type="number" name="total_extra" id="total_extra">
				</td> --}}
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-primary pull-right" onclick="calcular_total_extra()" data-dismiss="modal">Añadir</button>
				<button type="button" class="btn btn-default pull-right" data-dismiss="modal">Cerrar</button>
			</div>
		</div>
	</div>
  </div>
@endsection
@section('javascript')
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script type="text/javascript">
    $(document).ready(function() {
      var misession = localStorage.getItem('misession') ? JSON.parse(localStorage.getItem('misession')) : []
      if (!misession.name || !misession.phone || !misession.localidad) {
      pb.prompt(
        function (value) { 
          // 1
          localStorage.setItem('misession', JSON.stringify({name: value, phone: null, localidad: null}))
          pb.prompt(
            function (value) { 
              // 2
              misession = JSON.parse(localStorage.getItem('misession'))
              localStorage.setItem('misession', JSON.stringify({name: misession.name, phone: value, localidad: null}))
              pb.prompt(
                async function (value) { 
                  // 3
                  var milocation = await axios('https://delivery.appxi.net/api/poblacion/'+value)
                  misession = JSON.parse(localStorage.getItem('misession'))
                  localStorage.setItem('misession', JSON.stringify({name: misession.name, phone: misession.phone, localidad: milocation.data}))
                  //location.href = "{{setting('admin.url')}}marketplace?localidad="+value
                  location.reload()
                },
                'Gracias, en que localidad te encuentras ?',
                'select',
                '',
                'Enviar',
                'Cancelar'
              );
            },
            'Gracias, Ahora necesito tu whatsapp',
            'number',
            '',
            'Enviar',
            'Cancelar',
            {}
          );
          }, // Callback
          'Bienvenido a GoDelivery, Cual es tu Nombre Completo?',
          'text',
          '',
          'Enviar',
          'Cancelar'
        );            
      } else {
        @if(!isset($_GET['localidad']))
          misession = JSON.parse(localStorage.getItem('misession'))
          //location.href = "{{setting('admin.url')}}marketplace?localidad="+misession.localidad.id
          //location.reload()
        @endif
        $("#localidad").val(misession.localidad.id)
      }
    });
  </script>
  <script>
	$(document).ready( function(){
		// addextra('{{$producto->negocio_id}}' , '{{$producto->id}}')
    $('#precio_producto').val('{{$producto->precio}}')  
		totales()
		localStorage.setItem('extras', JSON.stringify([]));
		localidad_validacion()
    extras()
    opciones()
   
	});
  async function extras(){
    var condicion ='{{$producto->extra}}'
    
    if (condicion!=0) {
      $("#extras_opciones").attr("hidden",false); 
    }
  }
	async function localidad_validacion(){
		var user = JSON.parse(localStorage.getItem('misession'));

		localidad= user.localidad.id
		id='{{$producto->id}}'
		var negocio= await axios("{{setting('admin.url')}}api/producto/"+id)
		// console.log(negocio.data.negocio.poblacion_id)
		// console.log(localidad)
		if (negocio.data.negocio.poblacion_id!=localidad) {
			location.href="{{setting('admin.url')}}marketplace"
		}
	}
	async function totales(){
		var cantidad=$('#cantidad_producto').val()
		var subtotal_producto=parseFloat(cantidad)*parseFloat($('#precio_producto').val())
		$('#subtotal_producto').val(subtotal_producto)
		var total= subtotal_producto+parseFloat($('#subtotal_extras').val())
		$('#total_producto').val(total)

	}
	async function addextra(negocio_id , producto_id) {
        $("#table-extras tbody tr").remove();
        $("#producto_extra_id").val(producto_id);
        //$("#tr_producto").val(code);
        //console.log(extras)
        var mitable="";
        var extrasp=  await axios.get("{{ setting('admin.url') }}api/producto/extra/negocio/"+negocio_id);
        for(let index=0; index < extrasp.data.length; index++){
            // var image = extrasp.data[index].image ? extrasp.data[index].image : "{{ setting('productos.imagen_default') }}"
            // mitable = mitable + "<tr><td> <img class='img-thumbnail img-sm img-responsive' height=40 width=40 src='{{setting('admin.url')}}storage/"+image+"'></td><td>"+extrasp.data[index].id+"</td><td><input class='form-control extra-name' readonly value='"+extrasp.data[index].name+"'></td><td><input class='form-control extra-precio' readonly  value='"+extrasp.data[index].precio+" Bs."+"'></td><td><input class='form-control extra-cantidad' style='width:100px' type='number' min='0' value='0'  id='extra_"+extrasp.data[index].id+"'></td></tr>";
            // mitable = mitable + "<tr><td><input class='form-control extraprodid' readonly value='"+extrasp.data[index].id+"'></td><td><input class='form-control extra-name' readonly value='"+extrasp.data[index].nombre+"'></td><td><input class='form-control extra-precio' readonly  value='"+extrasp.data[index].precio+" Bs."+"'></td><td><input class='form-control extra-cantidad' style='width:100px' type='number' min='0' value='0'  id='extra_"+extrasp.data[index].id+"'></td></tr>";
			mitable = mitable + "<tr><td ><input class='form-control extraprodid' hidden value='"+extrasp.data[index].id+"'><input class='form-control col-sm-12 extra-name' readonly value='"+extrasp.data[index].nombre+"'></td><td><input class='form-control extra-precio' readonly  value='"+extrasp.data[index].precio+" Bs."+"'></td><td><input class='form-control extra-cantidad' style='width:100px' type='number' min='0' value='0'  id='extra_"+extrasp.data[index].id+"'></td></tr>";

        }
        $('#table-extras').append(mitable);
  }
  async function calcular_total_extra(){
    var cantidad=[];
    var name=[];
    var precio=[];
    var idprod=[];
    var index_cantidad=0;
    var index_name_aux=0;
    var index_precio_aux=0;
    var index_cantidad_aux=0;
    var index_idprod_aux=0;
    

    $('.extra-cantidad').each(function(){
        if($(this).val()>0){
            cantidad[index_cantidad_aux]=parseFloat($(this).val());
            index_cantidad_aux+=1;
            var index_name=0;
            $('.extra-name').each(function(){
                if(index_name==index_cantidad){
                    name[index_name_aux]=$(this).val();
                    index_name_aux+=1;
                }
                index_name+=1;
            });

            var index_precio=0;
            $('.extra-precio').each(function(){
                if(index_precio==index_cantidad){
                    precio[index_precio_aux]=parseFloat($(this).val());
                    index_precio_aux+=1;
                }
                index_precio+=1;
            });

            var index_idprod=0;
            $('.extraprodid').each(function(){
                if(index_idprod==index_cantidad){
                    idprod[index_idprod_aux]=parseFloat($(this).val());
                    index_idprod_aux+=1;
                }
                index_idprod+=1;
            });


        }
        index_cantidad+=1;
    });
    //   console.log(name)
    //   console.log(cantidad)
    //   console.log(precio)
    //   console.log(idprod)
    var nombre_extras=""
    var precio_extras=0
    for(let index=0;index<precio.length;index++){
    if (index+1<precio.length) {
      nombre_extras+=cantidad[index]+' '+name[index]+", ";
    }
    else{
      nombre_extras+=cantidad[index]+' '+name[index];
    }
        //console.log(nombre_extras)
        precio_extras+=parseFloat(cantidad[index])*parseFloat(precio[index]);
      }
    $('#texto_extras').val(nombre_extras)
    $('#subtotal_extras').val(precio_extras)

    //   for (let index = 0; index < idprod.length; index++) {
      
    //   }
    totales()
    var extras_temp={name:name, cantidad:cantidad, precio:precio, idprod:idprod}
    localStorage.setItem('extras', JSON.stringify(extras_temp))

  }
	$('#cantidad_producto').on('change', function() {
       
        if ($('#cantidad_producto').val()!=1) {
          $("#extras_opciones").attr("hidden",true);
          localStorage.setItem('extras', JSON.stringify([]));
          $('#subtotal_extras').val(0)
          $('#texto_extras').val("")
        }
        else{
          $("#extras_opciones").attr("hidden",false); 
        }
        totales()
    });
	
	$("#cantidad_producto").keyup(function(){
        if ($('#cantidad_producto').val()!=1) {
          $("#extras_opciones").attr("hidden",true);
          localStorage.setItem('extras', JSON.stringify([]));
          $('#subtotal_extras').val(0)
          $('#texto_extras').val("") 
        }
        else{
          $("#extras_opciones").attr("hidden",false); 
        }
        totales();

    });

	async function agregar_carrito(id) {
      //console.log("Hola "+id)
      var producto= await axios("{{setting('admin.url')}}api/producto/"+id)
      //console.log(producto.data)
      var user = JSON.parse(localStorage.getItem('misession'));
      var telefono ='591'+user.phone+'@c.us'
      var nombre = user.name
      var localidad= user.localidad.id
      var precio =0;
      var product_name=""
      if (producto.data.precio==0) {
        //valor del select precio
        //valor del select texto
        var aux_precio= await axios("{{setting('admin.url')}}api/precio/"+$('#opciones_producto').val())
        product_name=producto.data.nombre+" "+aux_precio.data.nombre
        precio= aux_precio.data.precio

      } else {
        precio=producto.data.precio
        product_name=producto.data.nombre
      }

      var cliente= await axios("{{setting('admin.url')}}api/cliente/"+telefono)
      if (cliente.data.poblacion_id) {
        
      }
      else{
        var midata={
          id:cliente.data.id,
          nombre:nombre,
        }
        await axios.post("{{setting('admin.url')}}api/cliente/update/nombre", midata)
        var midata={
          id:cliente.data.id,
          poblacion_id:localidad,
        }
        await axios.post("{{setting('admin.url')}}api/cliente/update/localidad", midata)
      }
      var data={
        product_id: id,
        product_name: product_name,
        chatbot_id: telefono,
        precio: precio,
        cantidad: parseInt($('#cantidad_producto').val()),
        negocio_id: producto.data.negocio.id,
        negocio_name: producto.data.negocio.nombre
      }
      var carrito= await axios.post("{{setting('admin.url')}}api/chatbot/cart/add", data)
	  var extras = JSON.parse(localStorage.getItem('extras'));
	  if (extras.idprod) {
		for (let index = 0; index < extras.idprod.length; index++) {
			var midata={
				extra_id:extras.idprod[index],
				precio:extras.precio[index],
				cantidad:extras.cantidad[index],
				total:parseFloat(extras.precio[index])*parseFloat(extras.cantidad[index]),
				carrito_id:carrito.data.id,
				producto_id:id
			}
			await axios.post("{{setting('admin.url')}}api/carrito/add/extras", midata)			
		}
		localStorage.setItem('extras', JSON.stringify([]));
    $('#subtotal_extras').val(0)
    $('#texto_extras').val("")
    totales()

	  }
      if (carrito.data) {
        var list = '*🎉 Producto agregado a tu carrito 🎉*\n'
        list += 'Si deseas agregar mas productos a tu carrito visita el mismo u otros negocios (A).\n'
        list += '------------------------------------------\n'
        list += '*A* .- PEDIR AHORA\n'
        list += '*B* .- SEGUIR COMPRANDO\n'
        // list += '*C* .- VER TU CARRITO\n'
        list += '------------------------------------------\n'
        list += 'ENVIA UNA OPCION ejemplo: A o B'
        
        //Mensaje a Cliente
        pb.info(
          'Producto Agregado a Carrito Exitosamente, debes terminar el Pedido en WhatsApp o puedes seguir añadiendo más productos a tu Carrito.'
        );
        // toastr.succes("Producto Agregado a Carrito Exitosamente, debes terminar el Pedido en WhatsApp o puedes seguir añadiendo más productos a tu Carrito.")
        var data={
          message:list,
          phone:telefono
        }
        await axios.post("{{setting('admin.chatbot_url')}}chat", data)
      }
    }

  async function opciones(){
    var id= '{{$producto->id}}'
    var producto= await axios("{{setting('admin.url')}}api/producto/"+id)
    if (producto.data.precio==0) {
      $("#op_producto").attr("hidden",false); 
      $('#opciones_producto').find('option').remove().end();
      var table= await axios("{{setting('admin.url')}}api/rel/precios/producto/"+id)
      //console.log(table.data)
      $('#opciones_producto').append($('<option>', {
          value: null,
          text: 'Elige una Opción'
      }));
      for (let index = 0; index < table.data.length; index++) {
          $('#opciones_producto').append($('<option>', {
              value: table.data[index].precios.id,
              text: table.data[index].precios.nombre+" "+table.data[index].precios.precio+" Bs."
          }));
      }
    }

  }
  $('#opciones_producto').on('change', async function(){
    if ( $('#opciones_producto').val()>0) {
      var aux_precio= await axios("{{setting('admin.url')}}api/precio/"+$('#opciones_producto').val())
      $('#precio_producto').val(aux_precio.data.precio)
      totales()
    }
  });
  </script>
@endsection