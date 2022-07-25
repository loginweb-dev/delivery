@extends('master')

@section('content')
    <!-- ========================= SECTION CONTENT ========================= -->
<section class="section-content bg padding-y-sm">
  <div class="container">
    <div class="card">
      <div class="card-body">
        @php
          $image=$negocio->logo ? $negocio->logo : setting('negocios.img_default_negocio');
          $latitud=$negocio->latitud ? $negocio->latitud : '-15.2411217' ;
          $longitud=$negocio->longitud ? $negocio->longitud : '-63.8812874';
        @endphp
        <div class="row">
          
          <div class="col-sm-2 "> 
            <img class="img-fluid img-thumbnail" src="{{setting('admin.url')}}storage/{{$image}}" width="150">                   
          </div>
          <div class="col-sm-4 text-left">
            <h3>{{ $negocio->nombre }}</h3> 
            <span>Dirección: <b>{{$negocio->direccion}}</b></span> <br>
            <span>Horario: <b>{{$negocio->horario}}</b></span><br>
            <span>Teléfono: <b>{{$negocio->telefono}}</b></span><br>
            <div id="panel_control" hidden>
              <a href="#" onclick="resetear_pw()" class="btn btn-success">Panel del Negocio <i class="fa fa-sign-in"></i></a>
            </div>

          </div>
          <div class="col-sm-6">
            <iframe width="100%"  id="gmap_canvas" src="https://maps.google.com/maps?q={{$latitud}},{{$longitud}}&hl=es&z=14&amp;output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>
          </div>
             
              
        </div>
       
      </div> <!-- card-body .// -->
      </div> <!-- card.// -->
      <div class="row-sm  mt-3">
        @foreach ($negocio->productos as $item)
          <div class="col-md-3 col-sm-6">
            <figure class="card card-product">
              @if ($item->image!=null)
                <div class="img-wrap"> <a href="{{route('producto', $item->id)}}"><img  src="{{ Voyager::image($item->thumbnail('cropped', 'image')) }}"></a></div>
              @else
                <div class="img-wrap"> <a href="{{route('producto', $item->id)}}"><img  src="{{setting('admin.url')}}storage/{{setting('productos.img_default_producto')}}" ></a></div>
              @endif
              <figcaption class="info-wrap">
                
                <a href="{{route('producto', $item->id)}}"><h4 class="title"><b>{{ $item->nombre }}</b></h4></a>
                <p>{{ $item->detalle }}</p>
                <div class="price-wrap">
                  @if ($item->precio > 0)
                    <span class="price-new"><h5><b>{{ $item->precio }} Bs.</b></h5></span>
                  @else
                    @php
                      $rel=App\RelProductoPrecio::where('producto_id', $item->id)->get();
                    @endphp 
                      @foreach ($rel as $item2)
                        @php
                          $precio_prod= App\Precio::find( $item2->precio_id);
                        @endphp
                          <span class="price-new"><b>{{ $precio_prod->nombre }} {{ $precio_prod->precio }} Bs.</b></span><br>
                      @endforeach
                      
                       
                  @endif
                </div>
  
                {{-- <div class="input-group">
                  <input name="cantidad_producto" id="cantidad_producto" type="number" class="form-control" value="1">
                  <div class="input-group-append">
                    <button onclick="agregar_carrito('{{$item->id}}')" class="btn btn-success">Añadir <i class="fa fa-cart-plus"></i></button>
                    <a  class="btn btn-sm btn-success"  data-toggle="modal" data-target="#modal-lista_extras" onclick="addextra('{{$item->negocio_id}}','{{$item->id}}')"><i class="fa fa-cart-plus"></i></a>
                  </div>
                </div> --}}
                    
              
              </figcaption>
            </figure>
          </div>
        @endforeach
      </div>
  </div>
</section>

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
                          <th>ID</th>
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
      localidad_validacion()
      activar_boton_panel()
    });
    async function activar_boton_panel(){
      var user = JSON.parse(localStorage.getItem('misession'));
      if (user.phone=='{{$negocio->telefono}}') {
        $("#panel_control").attr("hidden",false); 
      }
    }
    async function localidad_validacion(){
      var user = JSON.parse(localStorage.getItem('misession'));
      localidad= user.localidad.id
      if ('{{$negocio->poblacion_id}}'!=localidad) {
        location.href="{{setting('admin.url')}}marketplace"
      }
    }
    async function agregar_carrito(id) {
      //console.log("Hola "+id)
      var producto= await axios("{{setting('admin.url')}}api/producto/"+id)
      //console.log(producto.data)
      var user = JSON.parse(localStorage.getItem('misession'));
      var telefono ='591'+user.phone+'@c.us'
      var nombre = user.name
      var localidad= user.localidad.id

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
        product_name: producto.data.nombre,
        chatbot_id: telefono,
        precio: producto.data.precio,
        cantidad: parseInt($('#cantidad_producto').val()),
        negocio_id: producto.data.negocio.id,
        negocio_name: producto.data.negocio.nombre
      }
      var carrito= await axios.post("{{setting('admin.url')}}api/chatbot/cart/add", data)
      if (carrito.data) {
        var list = '*🎉 Producto agregado a tu carrito 🎉*\n'
        list += 'Si deseas agregar mas productos a tu carrito visita el mismo u otros negocios (A).\n'
        list += '------------------------------------------\n'
        list += '*H* .- VER MI CARRITO\n'
        list += '*G* .- SOLICITAR PEDIDO\n'
        list += '*A* .- TODOS LOS NEGOCIOS\n'
        list += '------------------------------------------\n'
        list += 'ENVIA UNA OPCION ejemplo: H o G'
        
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
            mitable = mitable + "<tr><td><input class='form-control extraprodid' readonly value='"+extrasp.data[index].id+"'></td><td><input class='form-control extra-name' readonly value='"+extrasp.data[index].nombre+"'></td><td><input class='form-control extra-precio' readonly  value='"+extrasp.data[index].precio+" Bs."+"'></td><td><input class='form-control extra-cantidad' style='width:100px' type='number' min='0' value='0'  id='extra_"+extrasp.data[index].id+"'></td></tr>";

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
      console.log(name)
      console.log(cantidad)
      console.log(precio)
      console.log(idprod)

      for (let index = 0; index < idprod.length; index++) {
        
      }
    }
    async function resetear_pw(){
      var user = JSON.parse(localStorage.getItem('misession'));
      var newpassword=Math.random().toString().substring(2, 8)
      var phone= '591'+user.phone+'@c.us'
      var midata={
        phone:phone,
        password:newpassword
      }
      var usuario= await axios.post("{{setting('admin.url')}}api/reset/pw/negocio", midata)
      var list=''
      list+='Credenciales para Ingresar al Sistema:\n'
      list+='Correo: '+usuario.data.email+' \n'
      list+='Contraseña: '+newpassword+' \n'
      list+='No comparta sus credenciales con nadie'
      var data={
          message:list,
          phone:phone
        }
      axios.post("{{setting('admin.chatbot_url')}}login", data)
      setTimeout(function(){
        location.href="/admin"
      }, 5000)
    }
  </script>
@endsection