<!DOCTYPE HTML>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="pragma" content="no-cache" />
  <meta http-equiv="cache-control" content="max-age=604800" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta name="author" content="GoDelivery">
  <title>{{ setting('site.title') }}</title>
  <link href="{{ Voyager::image(setting('site.logo')) }}" rel="shortcut icon" type="image/x-icon">
  <link href="{{ asset('ecommerce/css/bootstrap.css') }}" rel="stylesheet" type="text/css"/>
  {{-- <link href="ecommerce/fonts/fontawesome/css/fontawesome-all.min.css" type="text/css" rel="stylesheet"> --}}
  <link href="{{ asset('ecommerce/css/ui.css') }}" rel="stylesheet" type="text/css"/>
  <link href="{{ asset('ecommerce/css/responsive.css') }}" rel="stylesheet" media="only screen and (max-width: 1200px)" />
  <link rel="stylesheet" type="text/css" href="{{ asset('css/boxs.css') }}"> 
  <link rel="stylesheet" type="text/css" href="{{ asset('css/chatbot.css') }}"> 
  <link rel="stylesheet" type="text/css" href="{{ asset('css/cart.css') }}"> 
  <style>
  </style>
  @yield('css')
</head>
<body>
	@yield('content')
  {{-- //whatsapp --}}
	{{-- <div id="chat-circle" class="btn btn-raised">
		<div id="chat-overlay"></div><i class="fa fa-whatsapp fa-xl"></i>
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
	</div> --}}

  {{-- cart --}}
  {{-- <div id="cart-circle" class="btn btn-raised">
		<div id="chat-overlay"></div><i class="fa fa-cart-arrow-down fa-lg"></i>
	</div>
	<div class="cart-box">
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
	</div> --}}
  {{-- <button class="back-to-top">Back To Top</button> --}}
	<script src="{{ asset('ecommerce/js/jquery-2.0.0.min.js') }}" type="text/javascript"></script>
	<script src="{{ asset('ecommerce/js/bootstrap.bundle.min.js') }}" type="text/javascript"></script>
	<script src="{{ asset('ecommerce/js/script.js') }}" type="text/javascript"></script>
	<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
	<script src="https://kit.fontawesome.com/6510b28365.js" crossorigin="anonymous"></script>
	<script src="{{ asset('js/boxs.js') }}" crossorigin="anonymous"></script>
	<script src="{{ asset('js/chatbot.js') }}" crossorigin="anonymous"></script>
  <script>
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

  </script>
  @yield('javascript')
</body>
</html>