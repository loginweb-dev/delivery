<!DOCTYPE HTML>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="pragma" content="no-cache" />
  <meta http-equiv="cache-control" content="max-age=604800" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta name="author" content="GoDelivery">
  <title>{{ setting('site.title') }}</title>
  <link href="ecommerce/images/favicon.ico" rel="shortcut icon" type="image/x-icon">
  <link href="ecommerce/css/bootstrap.css" rel="stylesheet" type="text/css"/>
  <link href="ecommerce/fonts/fontawesome/css/fontawesome-all.min.css" type="text/css" rel="stylesheet">
  <link href="ecommerce/css/ui.css" rel="stylesheet" type="text/css"/>
  <link href="ecommerce/css/responsive.css" rel="stylesheet" media="only screen and (max-width: 1200px)" />
  <link rel="stylesheet" type="text/css" href="css/boxs.css"> 
  <link rel="stylesheet" type="text/css" href="css/chatbot.css"> 
</head>
<body>
  <!-- ========================= SECTION CONTENT ========================= -->
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
                      <li><i class="{{ $item->icon }}"></i> <a href="markplace?localidad={{$milocalidad}}&tipo={{$item->id}}" style="color: #38A54A; font-size: 18px;"> {{ $item->nombre }} <span class="float-right badge badge-light round">{{ $micant }}</span> </a></li>
                    @endforeach
                    
                    <li><i class="fa-solid fa-arrow-rotate-right"></i> <a href="markplace?localidad={{$milocalidad}}" style="color: #38A54A; font-size: 18px;"> Reset</a></li>
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
                          <li style="width:55%" class="stars-active"> 
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
                      </div>
                      <p style="font-size: 22px;"> {{ $item->direccion }} </p>
                  </article>
                  <aside class="col-sm-3 border-left">
                    <div class="action-wrap">
                      <p class="text-success">
                        <i class="fa-solid fa-location-dot"></i> {{ $item->poblacion->nombre }} <br>
                        <i class="fa-solid fa-filter"></i> {{ $item->tipo->nombre }}
                      </p>
                      <p>
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
  <!-- ========================= CHATBOT ========================= -->
  <div id="chat-circle" class="btn btn-raised">
    <div id="chat-overlay"></div><i class="fa fa-whatsapp"></i>
  </div>
  <div class="chat-box">
      <div class="chat-box-header">
          CHATBOT
          <span class="chat-box-toggle">x</span>
      </div>
      <div class="chat-box-body">
          <div class="chat-box-overlay">
      </div>
          <div class="chat-logs"></div><!--chat-log -->
      </div>
      <div class="chat-input">
          <form>
              <input type="text" id="chat-input" placeholder="Enviar un mensaje..."/>
              <button type="submit" class="chat-submit" id="chat-submit"><i class="fa fa-send"></i></button>
          </form>
      </div>
  </div>

  <script src="ecommerce/js/jquery-2.0.0.min.js" type="text/javascript"></script>
  <script src="ecommerce/js/bootstrap.bundle.min.js" type="text/javascript"></script>
  <script src="ecommerce/js/script.js" type="text/javascript"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="https://kit.fontawesome.com/6510b28365.js" crossorigin="anonymous"></script>
  <script src="js/boxs.js" crossorigin="anonymous"></script>
  <script src="js/chatbot.js" crossorigin="anonymous"></script>
  <script type="text/javascript">
    var pb = new PromptBoxes({
      attrPrefix: 'pb',
      speeds: {
        backdrop: 500,  // The enter/leaving animation speed of the backdrop
        toasts: 500     // The enter/leaving animation speed of the toast
      },
      alert: {
        okText: 'Ok',           // The text for the ok button
        okClass: '',            // A class for the ok button
        closeWithEscape: false, // Allow closing with escaping
        absolute: false         // Show prompt popup as absolute
      },
      confirm: {
        confirmText: 'Confirm', // The text for the confirm button
        confirmClass: '',       // A class for the confirm button
        cancelText: 'Cancel',   // The text for the cancel button
        cancelClass: '',        // A class for the cancel button
        closeWithEscape: true,  // Allow closing with escaping
        absolute: false         // Show prompt popup as absolute
      },
      prompt: {
        inputType: 'text',      // The type of input 'text' | 'password' etc.
        submitText: 'Submit',   // The text for the submit button
        submitClass: '',        // A class for the submit button
        cancelText: 'Cancel',   // The text for the cancel button
        cancelClass: '',        // A class for the cancel button
        closeWithEscape: true,  // Allow closing with escaping
        absolute: false         // Show prompt popup as absolute
      },
      toasts: {
        direction: 'top',       // Which direction to show the toast  'top' | 'bottom'
        max: 5,                 // The number of toasts that can be in the stack
        duration: 5000,         // The time the toast appears
        showTimerBar: true,     // Show timer bar countdown
        closeWithEscape: true,  // Allow closing with escaping
        allowClose: false,      // Whether to show a "x" to close the toast
      }
    });
    $(document).ready(function() {
      var misession = localStorage.getItem('misession') ? JSON.parse(localStorage.getItem('misession')) : []
      // var miregister = localStorage.getItem('miregister') ? parseInt(localStorage.getItem('miregister')) : 0
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
                      location.href = "markplace?localidad="+value
                    },
                    'Gracias, en que localidad te encuentras ?',
                    'select',
                    '',
                    'Enviar',
                    'Cancelar',
                    {}
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
              'Cancelar',
              {}
            );            
          } else {
            @if(!isset($_GET['localidad']))
              misession = JSON.parse(localStorage.getItem('misession'))
              location.href = "markplace?localidad="+misession.localidad.id
            @endif
            $("#localidad").val(misession.localidad.id)
            pb.success(
              'Bienvenido! '+misession.name
            );
          }
          }); 


  </script>
</body>
</html>