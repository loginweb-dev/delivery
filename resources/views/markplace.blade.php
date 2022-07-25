@extends('master')

@section('css')

@endsection
@section('content')
    <section class="section-content bg padding-y">
      <div class="container">
        <div class="row">
          <aside class="col-sm-3">
            <div class="card card-filter">
              <article class="card-group-item">
                <header class="card-header">
                  <a style="color: #38A54A" aria-expanded="true" href="#" data-toggle="collapse" data-target="#collapse22">
                    <i class="icon-action fa fa-chevron-down"></i>
                    <h4 class="title">Filtros</h4>
                  </a>
                </header>
                <div style="" class="filter-content collapse show" id="collapse22">
                  <div class="card-body">
                    <form class="pb-3">
                      <input name="localidad" id="localidad" type="text" hidden>
                      <div class="input-group">
                      <input name="criterio" class="form-control" placeholder="Buscar" type="text">
                      <div class="input-group-append">
                        <button class="btn btn-success" type="submit"><i class="fa fa-search"></i></button>
                      </div>
                      </div>
                    </form>
                    @php
                      $tipos = App\Tipo::with('negocios')->orderBy('created_at', 'desc')->get();
                      $milocalidad = isset($_GET['localidad']) ? $_GET['localidad'] : 0;
                    @endphp
                    <ul class="list-unstyled list-lg">
                      @foreach ($tipos as $item)
                        @php
                            $micant = count(App\Negocio::where('estado', 1)->where('tipo_id', $item->id)->where('poblacion_id', $milocalidad)->get());
                        @endphp
                        <li><i class="{{ $item->icon }}"></i> <a href="marketplace?localidad={{$milocalidad}}&tipo={{$item->id}}" style="color: #38A54A; font-size: 18px;"> {{ $item->nombre }} <span class="float-right badge badge-light round">{{ $micant }}</span> </a></li>
                      @endforeach
                      
                      <li><i class="fa-solid fa-arrow-rotate-right"></i> <a onclick="resetear_session()" href="marketplace?localidad={{$milocalidad}}" style="color: #38A54A; font-size: 18px;"> Reset</a></li>
                    </ul>  
                  </div>
                </div>
              </article>
            </div>

          </aside>
          <main class="col-sm-9">
            @php
              $milocalidad = isset($_GET['localidad']) ? $_GET['localidad'] : 0;
              if (isset($_GET['tipo'])){
                $negocios = App\Negocio::where('estado', 1)->where('poblacion_id', $milocalidad)->where('tipo_id', $_GET['tipo'])->orderBy('created_at', 'desc')->with('poblacion', 'tipo', 'productos')->get();
              }else if (isset($_GET['criterio'])){
                $negocios = App\Negocio::where('nombre', 'like', '%'.$_GET['criterio'].'%')->where('estado', 1)->where('poblacion_id', $milocalidad)->orderBy('created_at', 'desc')->with('poblacion', 'tipo', 'productos')->get();
              }else{
                $negocios = App\Negocio::where('estado', 1)->where('poblacion_id', $milocalidad)->orderBy('created_at', 'desc')->with('poblacion', 'tipo', 'productos')->get();
              }
            @endphp
            @foreach ($negocios as $item)
              @php
                  $miestado = $item->estado ? 'Abierto' : 'Cerrado';
              @endphp
              <article class="card card-product">
                <div class="card-body">
                  <div class="row">
                    <aside class="col-sm-3">
                      <div class="img-wrap"><img src="storage/{{ $item->logo }}"></div>
                    </aside>
                    <article class="col-sm-6">
                        <h4 class="title"><u> {{ $item->nombre }} </u></h4>
                        <div class="rating-wrap mb-2">
                          <ul class="rating-stars">
                            <li style="width: {{ $item->rating }}" class="stars-active"> 
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
                          <div class="label-rating"><i class="fa-solid fa-door-open"></i> {{ $miestado }}</div>
                          <div class="label-rating"><i class="fa-solid fa-boxes-stacked"></i> {{ count($item->productos) }} Productos</div>
                          <div class="label-rating"><i class="fa-brands fa-whatsapp"></i> {{ $item->telefono }}</div>
                          <div class="label-rating"><i class="fa-solid fa-business-time"></i> {{ $item->horario }}</div>
                        </div>
                        {{-- <small>{{ $item->horario }}</small> --}}
                        <p style="font-size: 22px;"> {{ $item->direccion }} </p>
                    </article>
                    <aside class="col-sm-3 border-left">
                      <div class="action-wrap">
                        <p class="text-success">
                          <i class="fa-solid fa-location-dot"></i> {{ $item->poblacion->nombre }} <br>
                          <i class="fa-solid fa-filter"></i> {{ $item->tipo->nombre }} <br>
                          <a href="/negocio/{{$item->slug }}" class="btn btn-success"> Ver Tienda </a>
                        </p>                      
                      </div>
                    </aside>
                  </div>
                </div>

              </article>
            @endforeach
          </main>
        </div>
      </div>
    </section>
@endsection

@section('javascript')
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
                  location.href = "marketplace?localidad="+value
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
          location.href = "marketplace?localidad="+misession.localidad.id
        @endif
        $("#localidad").val(misession.localidad.id)
      }
    });
  </script>
  <script>
    function resetear_session(){
      localStorage.setItem('misession', JSON.stringify([]));
      location.reload()
    }
  </script>
@endsection