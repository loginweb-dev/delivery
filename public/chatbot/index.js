const express = require('express');
const axios = require('axios');
const qrcode = require("qrcode-terminal");
var qr = require('qr-image');
var path = require('path');
const cors = require('cors')
const { Client, MessageMedia, LocalAuth, Location, Buttons} = require("whatsapp-web.js");

// const { io } = require("socket.io-client");
// const socket = io("https://socket.appxi.net");

const JSONdb = require('simple-json-db');
const negocios = new JSONdb('json/negocios.json');
const productos = new JSONdb('json/productos.json');
const carts = new JSONdb('json/carts.json');
const locations = new JSONdb('json/locations.json');
const localidades = new JSONdb('json/localidades.json');
const status = new JSONdb('json/status.json');
const pedidos = new JSONdb('json/pedidos.json');
const status_mensajero = new JSONdb('json/status_mensajero.json');
const status_negocio = new JSONdb('json/status_negocio.json');
const tipos = new JSONdb('json/tipos.json');
const extras = new JSONdb('json/extras.json');
const extra_carts = new JSONdb('json/extra_carts.json');
const pedidosencola = new JSONdb('json/pedidosencola.json');
const pedidomensajero = new JSONdb('json/pedidomensajero.json');
require('dotenv').config({ path: '../../.env' })

const app = express();
app.use(cors())
app.use(express.json())
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-one"
    }),
    puppeteer: {
        headless: true,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--no-sandbox']
    }
});

app.listen(process.env.CHATBOT_PORT, () => {
    console.log('CHATBOT ESTA LISTO EN EL PUERTO: '+process.env.CHATBOT_PORT);
});

var micount = 0
client.on("qr", (qrwb) => {
    var qr_svg = qr.image(qrwb, { type: 'png' });
    qr_svg.pipe(require('fs').createWriteStream('public/qrwb.png'));
    qrcode.generate(qrwb, {small: true}, function (qrcode) {
        console.log(qrcode)
        console.log('Nuevo QR, recuerde que se genera cada 1 minuto, INTENTO #'+micount++)
        
    })
});

client.on('ready', async () => {
	// app.listen(process.env.CHATBOT_PORT, () => {
	console.log('CHATBOT ESTA LISTO EN EL PUERTO: '+process.env.CHATBOT_PORT);
	// });
});

client.on("authenticated", () => {

});

client.on("auth_failure", msg => {
    console.error('AUTHENTICATION FAILURE', msg);
})

client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);
    var micliente = await axios(process.env.APP_URL+'api/cliente/'+msg.from)
    switch (msg.type) {
        case 'chat':
            if (micliente.data.nombre) {
                // if (micliente.data.poblacion_id) {
                    //reest
                        if (msg.body === 'reset') {
                            status.set(msg.from, 0)
                            await axios.post(process.env.APP_URL+'api/chatbot/cart/clean', {chatbot_id: msg.from})                    
                        }
                    if (micliente.data.modo === 'cliente') {                        
                        switch (status.get(msg.from)) {
                            case 0: //estado inicial
                                switch (true) {
                                    case (msg.body === 'hola') || (msg.body === 'HOLA') || (msg.body === 'Hola') || (msg.body === 'Buenas')|| (msg.body === 'buenas') || (msg.body === 'BUENAS') || (msg.body === '0'):
                                        menu_principal(micliente, msg.from)
                                        break;
                                    case (msg.body === 'A') || (msg.body === 'a'):
                                        negocios_list(msg.from, micliente)
                                        break;
                                    case negocios.has(msg.body.toUpperCase()):
                                        var miresponse = await axios(process.env.APP_URL+'api/filtros/'+negocios.get(msg.body.toUpperCase()))
                                        //Validación de que solo visualice los de su localidad
                                        if (micliente.data.poblacion_id== miresponse.data[0].negocio.poblacion_id) {
                                            var minegocio = miresponse.data[0].negocio
                                            var miestado = (miresponse.data[0].negocio.estado == 1) ? 'Abierto' : 'Cerrado'
                                            var list = '*'+minegocio.nombre.toUpperCase()+'*\n'
                                            // list += '----------------------------------'+'\n'
                                            list += '*Estado:* '+miestado+'\n'
                                            list += '*Horario:* '+minegocio.horario+'\n'
                                            list += '*Direccion:* '+minegocio.direccion+'\n'
                                            list += '----------------------------------'+'\n'
                                            list += '*MENU DEL DIA*\n'
                                            for (let index = 0; index < miresponse.data.length; index++) {
                                                list += '*P'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+'\n'
                                                productos.set('P'+miresponse.data[index].id, miresponse.data[index].id)
                                            }       
                                            list += 'Envia una opcion (P'+miresponse.data[0].id+' o P'+miresponse.data[1].id+')\n'
                                            list += '----------------------------------'+'\n'                                
                                            list += '*Visita nuestra tienda el linea en:*\n'
                                            list += process.env.APP_URL+'negocio/'+minegocio.slug
                                            // list += '----------------------------------'+'\n'   
                                            // list += '*Mas Opciones:*\n'
                                            // list += '*📞 :* Llamar\n'
                                            // list += '*🚩 :* Mapa\n' 
                                            // list += 'Envia un emoji'
                                            var mimedia = minegocio.logo ? MessageMedia.fromFilePath('../../storage/app/public/'+minegocio.logo) : MessageMedia.fromFilePath('imgs/mitienda.png');
                                            // bussiness.set(msg.from, minegocio.chatbot_id)
                                            client.sendMessage(msg.from, mimedia, {caption: list})
                                        }
                                        else{
                                            client.sendMessage(msg.from, '📍 El negocio solicitado no se encuentra en tu Localidad 📍')
                                        }                       
                                        break;
                                    case tipos.has(msg.body.toUpperCase()):
                                        var midata = {
                                            localidad: micliente.data.poblacion_id,
                                            tipo: tipos.get(msg.body.toUpperCase())
                                        }
                                        var miresponse = await axios.post(process.env.APP_URL+'api/negocios/tipo', midata)
                                        var list = '*🏚️ NEGOCIOS ('+miresponse.data[0].tipo.nombre+') 🏚️* \n'+micliente.data.localidad.nombre+'\n'
                                        list += '----------------------------------\n'
                                        for (let index = 0; index < miresponse.data.length; index++) {
                                            list += '*N'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' - ('+miresponse.data[index].productos.length+')\n'
                                            negocios.set('N'+miresponse.data[index].id, miresponse.data[index].id);
                                        }
                                        list += 'Envia una opcion ejemplo: (N'+miresponse.data[0].id+')\n'
                                        list += '----------------------------------\n'
                                        list += 'Visita nuestro marketplace en:\n'
                                        list += process.env.APP_URL+'marketplace'
                                        client.sendMessage(msg.from, list)
                                        break;
                                    case (msg.body === 'B') || (msg.body === 'b'):
                                        var list = '*Eres Mensajero o Administrador de Negocio ?*\n'
                                        list += '*A* .- Mensajero o Delivery\n'
                                        list += '*B* .- Administrador de Negocio \n'
                                        list += '*C* .- Volver \n'
                                        // list += '----------------------------------\n'
                                        list += 'Envia un opcion'
                                        client.sendMessage(msg.from, list)
                                        status.set(msg.from, 0.2)
                                        break;
                                    case (msg.body === 'C') || (msg.body === 'c'):
                                        var minegocio = await axios(process.env.APP_URL+'api/minegocio/'+msg.from)
                                        client.sendMessage(msg.from, '🚚 Somos un servicio de mensajaeria(delivery) todo por whatsapp y con un asistente virtual 🤖CHATBOT🤖, donde podras realizar tus compras a los 🍴 negocios🍴 de tu preferiencia, para mas informacion visita nuestra pagina web. 🚚\n'+process.env.APP_URL+'nosotros')
                                        break;
                                    case productos.has(msg.body.toUpperCase()):
                                        var miresponse = await axios(process.env.APP_URL+'api/producto/'+productos.get(msg.body.toUpperCase()))
                                        var miprecios = []
                                        if (miresponse.data) {
                                            if (miresponse.data.negocio.poblacion_id==micliente.data.poblacion_id) {
                                                var media = ''
                                                if (miresponse.data.image) {
                                                    media = MessageMedia.fromFilePath('../../storage/app/public/'+miresponse.data.image)
                                                } else {
                                                    media = MessageMedia.fromFilePath('imgs/default.png')
                                                }
                                                if (miresponse.data.precio != 0) {                                                    
                                                    var list = miresponse.data.nombre+' '+miresponse.data.precio+'Bs.\n'
                                                    list += miresponse.data.detalle+'\n'
                                                    list += '--------------------------\n'
                                                    list += '*A* .- Añadir a carrito\n'
                                                    list += '*B* .- Seguir comprando\n'
                                                    list += 'Envia una opcion'
                                                    status.set(msg.from, 0.3)
                                                    miprecios=miresponse.data.precio
                                                    client.sendMessage(msg.from, media, {caption: list})                                                    
                                                } else {
                                                    var miarray = ['A', 'B', 'C', 'D', 'E', 'F']                                    
                                                    var list = miresponse.data.nombre+'\n'
                                                    list += miresponse.data.detalle+'\n'
                                                    list += '--------------------------'+'\n'
                                                    for (let index = 0; index < miresponse.data.precios.length; index++) {
                                                        var precio = await axios(process.env.APP_URL+'api/precio/'+miresponse.data.precios[index].precio_id)
                                                        list += '*'+miarray[index]+'* .- '+precio.data.nombre+' '+precio.data.precio+'Bs.\n'
                                                        miprecios.push({opcion: miarray[index], precio: precio.data.precio})
                                                    }                                                    
                                                    list += 'Envia una opcion'
                                                    status.set(msg.from, 0.4)
                                                    client.sendMessage(msg.from, media, {caption: list})                                                    
                                                }
                                                if (miresponse.data.extra) {
                                                    var miextras = await axios(process.env.APP_URL+'api/producto/extra/negocio/'+miresponse.data.negocio_id)
                                                    carts.set(msg.from, {id: miresponse.data.id, nombre: miresponse.data.nombre, precio: miprecios, extra: miextras.data, negocio_id: miresponse.data.negocio_id, negocio_nombre: miresponse.data.negocio.nombre})
                                                }else{
                                                    carts.set(msg.from, {id: miresponse.data.id, nombre: miresponse.data.nombre, precio: miprecios, extra: false, negocio_id: miresponse.data.negocio_id, negocio_nombre: miresponse.data.negocio.nombre})
                                                }
                                            }
                                            else{
                                                client.sendMessage(msg.from, 'El producto mencionado no se encuentra en su localidad')
                                            }    
                                        } else {
                                            client.sendMessage(msg.from, 'El producto ahora NO esta disponible')
                                        } 
                                        break;
                                    default:
                                        if (msg.body === '❌' || msg.body === '🚮' || msg.body === 'eliminar' || msg.body === 'Eliminar' || msg.body === 'vaciar' || msg.body === 'Vaciar') {
                                            await axios.post(process.env.APP_URL+'api/chatbot/cart/clean', {chatbot_id: msg.from})
                                            status.set(msg.from, 0)
                                            client.sendMessage(msg.from, '❌ Carrito vacio 🚮')                            
                                            negocios_list(msg.from, micliente)
                                        }else if(msg.body === 'Carrito' || msg.body === 'carrito' || msg.body === 'Pedir' || msg.body === 'pedir' || msg.body === 'Ver' || msg.body === 'ver'){
                                            await cart_list(msg.from, micliente)
                                            list = '*A* .- Enviar pedido\n'
                                            list += '*B* .- Seguir comprando\n'
                                            // list += '*C* .- Agregar mas extras\n'                              
                                            list += 'Envia una opcion'    
                                            client.sendMessage(msg.from, list)  
                                            status.set(msg.from, 1.1)
                                           
                                        }else{
                                            client.sendMessage(msg.from, 'Envia un opcion valida')
                                        }
                                        break;
                                }
                                break;
                            case 0.4:
                                // var miprecios = precios.get(msg.from)
                                var miproducto = carts.get(msg.from)
                                var validar = false
                                for (let index = 0; index < miproducto.precio.length; index++) {
                                    if (msg.body.toUpperCase() === miproducto.precios[index].opcion) {
                                        carts.set(msg.from, {id: miproducto.id, nombre: miproducto.nombre, precios: miproducto.precios[index].precio, extras: miproducto.extras, negocio_id: miproducto.negocio_id, negocio_nombre: miproducto.negocio_nombre})
                                        validar = true
                                    }                                
                                }                     
                                if (validar) {
                                    list = '*A* .- Añadir a carrito\n'  
                                    list += '*B* .- Segui comprando\n'   
                                    if (miproducto.extra) {
                                        list += '*C* .- Ver extras del producto\n'
                                    }
                                    list += 'Envia una opcion'
                                    status.set(msg.from, 0.3)
                                    client.sendMessage(msg.from, list)
                                } else {
                                    client.sendMessage(msg.from, 'Ingresa un opcion valida')
                                }                  
                                break;
                            case 0.3: //agregar producto + precios + extreas
                                if (msg.body === 'A' || msg.body === 'a') {
                                    var miproducto = carts.get(msg.from)
                                    if (miproducto.extra) {
                                        var list = 'Te puede interesar los *EXTRAS* para el producto selecionado, '
                                        for (let index = 0; index < miproducto.extra.length; index++) {
                                            list += miproducto.extra[index].nombre+'('+miproducto.extra[index].precio+'Bs), '
                                        }
                                        list += '\n------------------------------------------\n'
                                        list += 'Deseas agregar extras ?\n'
                                        list += '*A* .- Si quiero\n'
                                        list += '*B* .- Esta vez no\n'
                                        list += 'Envia un opcion'
                                        client.sendMessage(msg.from, list)
                                        status.set(msg.from, 0.5)
                                    } else if (msg.body === 'b' || msg.body === 'B') {
                                        client.sendMessage(msg.from, 'Genial, ingresa una cantidad (1-9) para agragar el producto: *'+miproducto.nombre+'*')
                                        status.set(msg.from, 1)
                                    }else{
                                        client.sendMessage(msg.from, 'Envia una opcion valida')
                                    }                                    
                                }else if (msg.body === 'B' || msg.body === 'b') {
                                    negocios_list(msg.from, micliente)
                                    status.set(msg.from, 0)
                                }else if (msg.body === 'c' || msg.body === 'C') {
                                    extras_view(msg.from)
                                } else {
                                    client.sendMessage(msg.from, 'Envia un opcion valida')
                                }
                                break;
                            case 0.5:
                                var miproducto = carts.get(msg.from)
                                if (msg.body === 'A' || msg.body === 'a') {   
                                    var midata = {
                                        product_id: miproducto.id,
                                        product_name: miproducto.nombre,
                                        chatbot_id: msg.from,
                                        precio: miproducto.precio,
                                        cantidad: 1,
                                        negocio_id: miproducto.negocio_id,
                                        negocio_name: miproducto.negocio_nombre
                                    }
                                    await axios.post(process.env.APP_URL+'api/chatbot/cart/add', midata)
                                    extras_list(msg.from)
                                    // client.sendMessage(msg.from, 'Genial, que extra quieres agregar ?')
                                    status.set(msg.from, 1.2)
                                }else if (msg.body === 'B' || msg.body === 'b') {
                                    client.sendMessage(msg.from, 'Genial, ingresa una cantidad para agragar a tu carrito (1-9)\nProducto: *'+miproducto.nombre+'*')
                                    status.set(msg.from, 1)
                                }else{
                                    client.sendMessage(msg.from, 'Envia un opcion valida')
                                }
                                break;
                            case 0.1:
                                if (localidades.has(msg.body.toUpperCase())) {
                                    var clientel = await axios.post(process.env.APP_URL+'api/cliente/update/localidad', {id: micliente.data.id, poblacion_id: localidades.get(msg.body.toUpperCase())})
                                    menu_principal(clientel, msg.from)
                                    status.set(msg.from, 0)
                                } else {
                                    var mispoblaciones = await axios(process.env.APP_URL+'api/poblaciones')
                                    var list = '*En que localidad te encuentras ?*\n'
                                    list += '----------------------------------'+'\n'
                                    for (let index = 0; index < mispoblaciones.data.length; index++) {
                                        list +=  '*Z'+mispoblaciones.data[index].id+'* .- '+mispoblaciones.data[index].nombre+'\n'
                                    }
                                    list += '----------------------------------\n'
                                    list += '*Envia un opcion ejemplo: z1 o z2*'
                                    client.sendMessage(msg.from, list)
                                }
                                break;
                            case 0.2: // cantidad del produto
                                if (msg.body === 'A' || msg.body === 'a') {
                                    var midata = {
                                        phone: msg.from,
                                        modo: 'mensajero'
                                    }
                                    await axios.post(process.env.APP_URL+'api/cliente/modo/update', midata)
                                    status.set(msg.from, 0)
                                    menu_mensajero(msg.from)
                                }else if (msg.body === 'B' || msg.body === 'b') {
                                    var midata = {
                                        phone: msg.from,
                                        modo: 'negocio'
                                    }
                                    await axios.post(process.env.APP_URL+'api/cliente/modo/update', midata)
                                    status.set(msg.from, 0)
                                    menu_negocio(msg.from)
                                }else if (msg.body === 'C' || msg.body === 'c') {
                                    status.set(msg.from, 0)
                                    menu_principal(micliente, msg.from)
                                } else {
                                    client.sendMessage(msg.from, 'Ingreas un opcion valida')
                                }
                                break;
                            case 1: //agragar a carrito desde Y
                                if (Number.isInteger(parseInt(msg.body)) && parseInt(msg.body) > 0 && parseInt(msg.body) <= 9) {
                                    var miprodcuto = carts.get(msg.from)                                         
                                    var midata = {
                                        product_id: miprodcuto.id,
                                        product_name: miprodcuto.nombre,
                                        chatbot_id: msg.from,
                                        precio: miprodcuto.precio,
                                        cantidad: msg.body,
                                        negocio_id: miprodcuto.negocio_id,
                                        negocio_name: miprodcuto.negocio_nombre
                                    }
                                    await axios.post(process.env.APP_URL+'api/chatbot/cart/add', midata)
                                    await cart_list(msg.from, micliente)
                                    var list = '*A* .- Enviar pedido\n'  
                                    list += '*B* .- Seguir comprando\n'
                                    list += 'Envia una opcion'                   
                                    client.sendMessage(msg.from, list)
                                    status.set(msg.from, 1.1)                                     
                                } else {
                                    client.sendMessage(msg.from, 'Ingresa una cantidad valida (1-9)')
                                }
                                break;
                            case 1.1: 
                                if (msg.body === 'B' || msg.body === 'b'){
                                    negocios_list(msg.from, micliente)
                                    status.set(msg.from, 0)
                                }else if (msg.body === 'C' || msg.body === 'c'){
                                    extras_list(msg.from)
                                    status.set(msg.from, 1.2)
                                }else if (msg.body === 'A' || msg.body === 'a'){
                                    var list = '🤖Inicio del pedido🤖\n'
                                    list += '------------------------------------------\n'
                                    list += '*A* .- Envia tu ubicacion (mapa), no olvides habilitar tu GPS.\n'
                                    list += '*B* .- Envia tu ultima ubicacion registrada.\n' 
                                    list += '*C* .- Seguir comprando.\n'   
                                    list += 'Envia una opcion'                            
                                    client.sendMessage(msg.from, list)
                                    status.set(msg.from, 1.3)
                                }else{
                                    client.sendMessage(msg.from, 'Ingresa una opcion valida')
                                }
                                break;
                            case 1.2: // set extras 
                                var miproducto = carts.get(msg.from)
                                var validar = false
                                var extra_id = 0
                                var extra_nombre = null
                                var milist = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
                                for (let index = 0; index < miproducto.extra.length; index++) {
                                    if (milist[index] === msg.body.toUpperCase()) {
                                        validar = true
                                        extra_id = miproducto.extra[index].id
                                        extra_nombre = miproducto.extra[index].nombre
                                        break;
                                    }
                                }
                                if (validar) {
                                    extra_carts.set(msg.from, extra_id)
                                    status.set(msg.from, 1.9)      
                                    client.sendMessage(msg.from, 'Ingresa una cantidad (1-9)\nExtra: *'+extra_nombre+'*')
                                } else {
                                    await extras_list(msg.from)
                                    client.sendMessage(msg.from, 'Envia una opcion valida')
                                }
                                break;
                            case 1.9: // set cantidad extra
                                if (Number.isInteger(parseInt(msg.body)) && parseInt(msg.body) <= 9 && parseInt(msg.body) > 0) {
                                    var miproducto = carts.get(msg.from)
                                    var extra = await axios(process.env.APP_URL+'api/producto/extra/get/'+extra_carts.get(msg.from))
                                    var cart = await axios(process.env.APP_URL+'api/cart/producto/get/'+msg.from)
                                    var midata = {
                                        extra_id: extra.data.id,
                                        precio: extra.data.precio,
                                        cantidad: parseInt(msg.body),
                                        total: parseFloat(extra.data.precio) * parseInt(msg.body),
                                        carrito_id: cart.data.id,
                                        producto_id: miproducto.id
                                    }
                                    await axios.post(process.env.APP_URL+'api/carrito/add/extras', midata)
                                    await cart_list(msg.from, micliente)
                                    list = '*A* .- Enviar pedido\n'
                                    list += '*B* .- Seguir comprando\n'
                                    list += '*C* .- Agregar mas extras\n'                              
                                    list += 'Envia una opcion'    
                                    client.sendMessage(msg.from, list)  
                                    status.set(msg.from, 1.1)
                                } else {
                                    client.sendMessage(msg.from, 'Ingresa una cantidad valida (1-9)')
                                }                         
                                break;
                            case 1.3: //estado para mapa
                                if (msg.body === 'A' || msg.body === 'a'){
                                    client.sendMessage(msg.from, 'Envia tu ubicacion (mapa)\nNo olvides activar tu GPS.')
                                    status.set(msg.from, 1.4)
                                } else if (msg.body === 'B' || msg.body === 'b'){
                                    var milocation = await axios(process.env.APP_URL+'api/ubicacion/'+locations.get(msg.from))                           
                                    if (milocation.data) {
                                        client.sendMessage(msg.from, 'Ubicacion elegida: '+milocation.data.detalles)
                                        pasarelas_list(msg.from)
                                        status.set(msg.from, 1.6)
                                    } else {
                                        client.sendMessage(msg.from, 'No tienes ubicacion registrada\nEnvia tu ubicacion (mapa), No olvides activar tu GPS.')
                                        status.set(msg.from, 1.4)
                                    }
                                } else if (msg.body === 'C' || msg.body === 'c'){
                                    status.set(msg.from, 0)
                                    negocios_list(msg.from, micliente)
                                } else {
                                    client.sendMessage(msg.from, 'Intenta con una opcion valida.')
                                }
                                break;    
                            case 1.4:
                                client.sendMessage(msg.from, 'Envia tu ubicacion (mapa)\nNo olvides activar tu GPS.')
                                break;      
                            case 1.5: // registrar descripcion de la ubicacion
                                    var milocation = locations.get(msg.from)
                                    await axios.post(process.env.APP_URL+'api/ubicacion/update', {id: milocation, detalle: msg.body})                        
                                    pasarelas_list(msg.from)
                                    status.set(msg.from, 1.6)
                                break;                        
                            case 1.6: // enviar pedido
                                var micart = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', {chatbot_id: msg.from})
                                if (micart.data.length != 0)
                                {
                                    if (micart.data.length != 0 && micliente.data.ubicaciones.length != 0){
                                        switch (true) {
                                            case (msg.body.toUpperCase() === 'A' || msg.body.toUpperCase() === 'a'):
                                                var midata = {
                                                    chatbot_id: msg.from,
                                                    pago_id: msg.body.substring(1, 99),
                                                    cliente_id: micliente.data.id,
                                                    ubicacion_id: locations.get(msg.from)
                                                }
                                                var newpedido = await axios.post(process.env.APP_URL+'api/pedido/save', midata)
                                                //Lógica para Agrupar Negocios y actuzliar pedido--------------------------
                                                var negocios3= await axios(process.env.APP_URL+'api/pedido/negocios/'+newpedido.data.id)
                                                var send_negocios = []
                                                var searchrep = []
                                                for (let index = 0; index < negocios3.data.length; index++) {
                                                    if(searchrep[index] === negocios3.data[index].negocio.id){
                                                        // ?
                                                    }else{
                                                        var rep=0;
                                                        for (let j = 0; j < send_negocios.length; j++) {
                                                            if(send_negocios[j].id==negocios3.data[index].negocio.id){
                                                                rep+=1;
                                                            }                                
                                                        }
                                                        if(rep==0){
                                                            send_negocios.push(negocios3.data[index].negocio)
                                                        }
                                                    }
                                                    searchrep.push(negocios3.data[index].negocio.id)
                                                }
                                                var midata2={
                                                    pedido_id: newpedido.data.id,
                                                    negocios: send_negocios.length,
                                                    total_delivery: send_negocios.length * parseFloat(micliente.data.localidad.tarifa)
                                                }
                                                await axios.post(process.env.APP_URL+'api/update/pedido/delivery', midata2)
                                                var mipedido = await axios(process.env.APP_URL+'api/pedido/'+newpedido.data.id)

                                                var list = '🕦 *Pedido #'+mipedido.data.id+' Enviado* 🕦 \n Se te notificará el proceso de tu pedido, por este mismo medio, *GRACIAS POR TU PREFERENCIA*'
                                                client.sendMessage(msg.from, list)
                                                status.set(msg.from, 2.1)
                                                //Enviar pedidos por negocio----------------------
                                                for (let index = 0; index < send_negocios.length; index++) {
                                                    var total_pedido_actual=0
                                                    var total_extras =0
                                                    var mismg=''
                                                    mismg += 'Hola, *'+negocios3.data[index].negocio_name+'* tienes un pedido solicitado, con el siguiente detalle: \n'
                                                    // mismg += '------------------------------------------\n'
                                                    mismg += '*Pedido #:* '+negocios3.data[index].pedido_id+'\n'
                                                    mismg += '*Cliente:* '+mipedido.data.cliente.nombre+'\n'
                                                    // mismg += '*Fecha:* '+negocios3.data[index].published+'\n'
                                                    mismg += '------------------------------------------\n'
                                                    for (let j = 0; j < negocios3.data.length; j++) {
                                                        if (send_negocios[index].id== negocios3.data[j].negocio.id) {
                                                            total_pedido_actual+=negocios3.data[j].total
                                                            mismg += '*Producto:* '+negocios3.data[j].cantidad+' '+negocios3.data[j].producto_name+'\n'
                                                            var epp = 0
                                                            var miextra = await axios(process.env.APP_URL+'api/extra/'+mipedido.data.productos[j].id)
                                                            if (miextra.data) {
                                                                for (let x = 0; x < miextra.data.length; x++) {
                                                                    mismg += '   -> '+miextra.data[x].cantidad+' '+miextra.data[x].extra.nombre+' (extra)\n'
                                                                    total_extras+= parseFloat(miextra.data[x].total)
                                                                    epp += total_extras

                                                                }
                                                            }

                                                            mismg += '*SubTotal:* '+(negocios3.data[j].total+epp)+' Bs.\n'
                                                            // mismg += '------------------------------------------\n'
                                                            var telef_negocio=negocios3.data[j].negocio.telefono
                                                            var telef_negocio='591'+telef_negocio+'@c.us'
                                                        }
                                                    }
                                                    mismg += '*Total:* '+(total_pedido_actual+total_extras)+' Bs.\n'
                                                    // mismg += '*Extras:* '+total_extras+' Bs.\n'
                                                    mismg += '------------------------------------------\n'
                                                    mismg += 'La asignación a un Delivery está en proceso, ve realizando el pedido porfavor.'
                                                    client.sendMessage(telef_negocio, mismg)
                                                }
        
                                                //ENVIAR PEDIDOS A MENSAJEROS-------------------------
                                                ubic_cliente=''
                                                ubic_cliente +='Ubicación del Cliente: '+mipedido.data.cliente.nombre+' - '
                                                ubic_cliente +=mipedido.data.ubicacion.detalles
                                                // const locationcliente = new Location(mipedido.data.ubicacion.latitud, mipedido.data.ubicacion.longitud, ubic_cliente);
                                                var mensajeroslibre = await axios(process.env.APP_URL+'api/mensajeros/libre/'+micliente.data.poblacion_id)
                                                for (let index = 0; index < mensajeroslibre.data.length; index++) {   
                                                    var total_mensajero = 0
                                                    var cantidad_mensajero = 0 
                                                    var mitext = '' 
                                                    mitext += 'Hola, *'+mensajeroslibre.data[index].nombre+'* hay un pedido disponible con el siguiente detalle:\n'                       
                                                    mitext += '------------------------------------------\n'
                                                    mitext += '*Pedido :* #'+mipedido.data.id+'\n'
                                                    mitext += '*Cliente :* '+mipedido.data.cliente.nombre+'\n'
                                                    mitext += '*Ubicacion :* '+mipedido.data.ubicacion.detalles+'\n'
                                                    // mitext += '------------------------------------------\n'
                                                    var total_extras = 0
                                                    for (let j = 0; j < mipedido.data.productos.length; j++) {
                                                        mitext += mipedido.data.productos[j].cantidad+' '+mipedido.data.productos[j].producto_name+' ('+mipedido.data.productos[j].negocio_name+')\n'
                                                        var miextra = await axios(process.env.APP_URL+'api/extra/'+mipedido.data.productos[j].id)
                                                        if (miextra.data) {
                                                            for (let x = 0; x < miextra.data.length; x++) {
                                                                mitext += '   -> '+miextra.data[x].cantidad+' '+miextra.data[x].extra.nombre+' (extra)\n'
                                                                total_extras+= parseFloat(miextra.data[x].total)
                                                            }
                                                        }
                                                        total_mensajero += mipedido.data.productos[j].total 
                                                        cantidad_mensajero += mipedido.data.productos[j].cantidad
                                                    }
                                                    mitext += '------------------------------------------\n'
                                                    mitext += '*Productos:* '+cantidad_mensajero+' Cant.\n'                                               
                                                    mitext += '*Negocios:* '+send_negocios.length+' Cant.\n'
                                                    mitext += '*Extras:* '+total_extras+' Bs.\n'
                                                    mitext += '*Delivery:* '+((send_negocios.length)*parseFloat(micliente.data.localidad.tarifa))+' Bs.\n'
                                                    mitext += '*Total:* '+(total_extras+total_mensajero+((send_negocios.length)*parseFloat(micliente.data.localidad.tarifa)))+' Bs.\n'
                                                    mitext += '------------------------------------------\n'
                                                    mitext += 'QUIERES TOMAR EL PEDIDO *#'+mipedido.data.id+'* ?\n'
                                                    mitext += '*A* .- Si quiero\n'
                                                    mitext += '*B* .- Ver todos los pedidos pendisntes\n'
                                                    mitext += 'Envia una opcion'                                                
                                                    client.sendMessage(mensajeroslibre.data[index].telefono, mitext)
                                                    pedidosencola.set(mensajeroslibre.data[index].telefono, mipedido.data.id)
                                                }
                                                pedidosencola.set(msg.from, mipedido.data.id) // pedido
                                                break;
                                            case (msg.body.toUpperCase() === 'B' || msg.body.toUpperCase() === 'b'):
                                                var bp_array={
                                                    "paymentId": mipedido.data.id,
                                                    "gloss": "Pago por Servicio Delivery y Productos",
                                                    "amount": (mipedido.data.total + mipedido.data.total_delivery),
                                                    "currency": "BOB",
                                                    "singleUse": "true",
                                                    "expiration": "1/00:05",
                                                    "affiliate": "02e4b31f-20bd-43f9-9f2d-3ef7733f2d0f",
                                                    "business": "02e4b31f-20bd-43f9-9f2d-3ef7733f2d0f",
                                                    "code": "",
                                                    "type": "Banipay",
                                                    "idCommercial": "BC-0598"
                                                }
                                                var banipay = await axios.post("https://v2.banipay.me/api/pagos/qr-payment", bp_array)
                                                const media = new MessageMedia('image/png', banipay.data.image);
                                                var midata2={
                                                    externalId:banipay.data.externalId,
                                                    identifier: banipay.data.identifier,
                                                    image: banipay.data.image,
                                                    id_banipay: banipay.data.id
                                                }
                                                await axios.post(process.env.APP_URL+'api/banipay/dos/save', midata2)
                                                var list = '🕦 *Pedido #'+mipedido.data.id+' Enviado* 🕦 \n Se te notificará el proceso de tu pedido, por este mismo medio. \n 🎉 *GRACIAS POR TU PREFERENCIA* 🎉\n'
                                                list += '-----------------\n'
                                                list += 'Instrucciones para Pagar con QR (Opcional): \n'
                                                list += 'Paso 1.- Escanea el QR desde la App de tu Banco \n'
                                                list += 'Paso 2.- Realiza la transacción\n'
                                                list += 'Paso 3.- Envía: una captura(imagen) del pago, para verificar el estado de la transacción'
                                                client.sendMessage(msg.from, media, {caption: list})
                                                status.set(msg.from, 1.7)
                                                break;
                                            case (msg.body.toUpperCase() === 'C' || msg.body.toUpperCase() === 'c'):
                                                client.sendMessage(msg.from, 'En Desarrollo')
                                                break;
                                            default:
                                                await pasarelas_list(msg.from)
                                                client.sendMessage(msg.from, 'Envia una opcion valida')
                                                break;
                                        }
                                    }
                                }else {
                                    client.sendMessage(msg.from, 'Tu carrito esta vacio')
                                    status.set(msg.from, 0)
                                }
                                break;
                            case 1.7: // pago  QR
                                client.sendMessage(msg.from, 'Envia una imagen o captura del pago por QR.')
                                break;
                            case 2: // esperando pedido      
                                if (msg.body === 'A' || msg.body === 'a') {
                                    client.sendMessage(msg.from, 'Genial, gracias por confiar en *GoDelivery*, envia un comentario sobre nuestro servicio porfavor🙏🏼.')
                                    status.set(msg.from, 3)
                                } else if (msg.body === 'B' || msg.body === 'b') {
                                    
                                }else{
                                    client.sendMessage(msg.from, 'Envia una opcion valida.')
                                }                
                                break;
                            case 2.1:
                                client.sendMessage(msg.from, 'Espera a que el sistema asigne un delivery para tu pedido.')
                                break;
                            case 3: // esperando comentario    
                                var midata = {
                                    telefono: msg.from,
                                    description: msg.body
                                }
                                var pedido_comentario = await axios.post(process.env.APP_URL+'api/pedido/comentario', midata)
                                var mitext = 'Tu comentario: *'+msg.body+'* respecto al pedido *#'+pedido_comentario.data.id+'*, fue registrado exitosamente, Gracias por tu preferencia.'
                                status.set(msg.from, 0)
                                pedidos.delete(msg.from)
                                encola.delete(pedido_comentario.data.mensajero.telefono)                                
                                client.sendMessage(msg.from, mitext)

                                //habiliar a mensajero
                                status_mensajero.set(pedido_comentario.data.mensajero.telefono, 0)
                                // listar pedidos en cola
                                client.sendMessage(pedido_comentario.data.mensajero.telefono, 'Ahora estas libre para recibir mas pedidos, estate atento al proximo.')
                                break;
                            default:
                                client.sendMessage(msg.from, 'Intenta con otro opcion\nEstado: '+status.get(msg.from))
                                break;
                        }
                    } else if (micliente.data.modo === 'mensajero'){     
                        switch (status_mensajero.get(msg.from)) { 
                            case 0:
                                if (msg.body === 'B' || msg.body === 'b'){
                                    await axios(process.env.APP_URL+'api/mensajero/update/'+msg.from)
                                    menu_mensajero(msg.from) 
                                }else if (msg.body === 'C' || msg.body === 'c'){
                                    var cliente_update = await axios.post(process.env.APP_URL+'api/cliente/modo/cliente', {phone: msg.from})
                                    menu_principal(cliente_update, msg.from)
                                }else if (msg.body === 'A' || msg.body === 'a'){
                                    var encola = await axios(process.env.APP_URL+'api/pedidos/get/encola')
                                    var list = '*Pedidos en cola, elige uno para iniciar el proceso*\n'
                                    for (let index = 0; index < encola.data.length; index++) {
                                        list += '*'+encola.data[index].id+'* : '+encola.data[index].cliente.nombre+' '+encola.data[index].published+'\n' 
                                    }
                                    list +='Envia el codido del pedido'
                                    client.sendMessage(msg.from, list)
                                    m
                                    status_mensajero.set(msg.from, 0.1)
                                }else{
                                    menu_mensajero(msg.from)
                                }
                                break;    
                            case 0.1:
                                var mipedido_id = Number.isInteger(parseInt(msg.body)) ? parseInt(msg.body) : 0
                                var mipedido = await axios(process.env.APP_URL+'api/pedido/'+mipedido_id)
                                if (mipedido.data) {                                    
                                    var midata = {
                                        telefono: msg.from,
                                        pedido_id: mipedido_id
                                    }
                                    var asignar = await axios.post(process.env.APP_URL+'api/asignar/pedido', midata)
                                    if (asignar.data) {
                                        var mitext='🎉Felicidades se te fue asignado el PEDIDO #'+mipedido_id+'🎉\n'
                                        mitext+= '------------------------------------------\n'
                                        mitext+= 'Porfavor, procede a ir lo antes posible a recoger el pedido a los negocios respectivos, envía tu *UBICACIÓN EN TIEMPO REAL* al cliente para iniciar el viaje porfavor.\n'
                                        mitext+= '------------------------------------------\n'
                                        mitext+= '*A* .- Ya recogi todos los productos\n'
                                        mitext+= '*B* .- Cancelo el pedido\n'
                                        mitext+= 'Envia una opcion'                              
                                        client.sendMessage(msg.from, mitext)
                                        // status_mensajero.set(msg.from, 1)                            
                                        //notificacion al cliente
                                        var pedido= await axios(process.env.APP_URL+'api/pedido/'+mipedido_id)
                                        var contacto_cliente= await client.getContactById(pedido.data.cliente.chatbot_id)
                                        client.sendMessage(msg.from, contacto_cliente);
                                        var mitext=''
                                        mitext += 'Tu pedido fue asignado al delivery: *'+pedido.data.mensajero.nombre+'*, se te notificara cuando el delivery recoga tu pedido y este de ida entregar.'
                                        client.sendMessage(pedido.data.chatbot_id, mitext)                                    
                                        //notificacion a los negocios ---------------
                                        var send_negocios= await negocios_pedido(mipedido_id)
                                        for (let index = 0; index < send_negocios.length; index++) {
                                            mitext= ''
                                            mitext+= 'El delivery: *'+pedido.data.mensajero.nombre+'* será el encargado de recoger el pedido *#'+mipedido_id+'*'
                                            var telefono_negocio= '591'+send_negocios[index].telefono+'@c.us'
                                            client.sendMessage(telefono_negocio, mitext)                           
                                        }       
                                        status_mensajero.set(msg.from, 1)
                                        pedidomensajero.set(msg.from, mipedido.data)                                   
                                    } else {
                                        client.sendMessage(msg.from, 'El pedido *#'+mipedido_id+'* ya está asignado a otro Delivery, intenta con otro pedido.')
                                    }
                                } else {
                                    client.sendMessage(msg.from, 'Envia una opcion valida')
                                }
                                break;
                            case 1: //para recoger
                                if (msg.body === 'a' || msg.body === 'A') {
                                    var pedido = pedidomensajero.get(msg.from)
                                    var mitext = 'Genial, ya recogiste todos los productos ahora llevalo hasta el cliente, no olvides enviar tu *UBICACIÓN EN TIEMPO REAL*\n'
                                    mitext+= '------------------------------------------\n'
                                    mitext+= '*A* .- Ya entregue el pedido\n'
                                    mitext+= 'Envia una opcion'
                                    status_mensajero.set(msg.from, 2)
                                    client.sendMessage(msg.from, mitext)
                                    mitext=''
                                    mitext += 'Tu pedido *#'+pedido.id+'* ya fue entregado al delivery asignado y está siendo llevado, porfavor estate atento.'
                                    client.sendMessage(pedido.chatbot_id, mitext)
                                } else if(msg.body === 'B' || msg.body === 'b') {
                                    
                                }else{
                                    client.sendMessage(msg.from, 'Envia una opcion valida') 
                                }
                                break;
                            case 2: //para q entregar
                                if (msg.body === 'a' || msg.body === 'A') {
                                    var pedido = pedidomensajero.get(msg.from)
                                    var mitext=''
                                    mitext += 'El pedido *#'+pedido.id+'* fue entregado al cliente *'+pedido.cliente.nombre+'* correctamente, espera que el cliente confirme el mismo.'
                                    client.sendMessage(msg.from, mitext)
                                    mitext=''
                                    mitext += 'El delivery confirmo que tu pedido ya fue entregado\n'
                                    mitext = 'Ya llego tu pedido *#'+pedido.id+'* ?\n'
                                    mitext += '*A* .- Si llego\n'
                                    mitext += '*B* .- No llego\n'
                                    mitext += 'Envia una opcion'         
                                    client.sendMessage(pedido.chatbot_id, mitext)
                                    status.set(pedido.chatbot_id, 2)
                                } else {
                                    client.sendMessage(msg.from, 'Envia una opcion valida') 
                                }
                                break;          
                            default:
                                client.sendMessage(msg.from, 'Interactuando como '+micliente.data.modo+'\nEstate atento al proximo pedido.')
                                break;
                        }
                    } else if (micliente.data.modo === 'negocio'){
                        switch (status_negocio.get(msg.from)) {
                            case 0:
                                if (msg.body === '🔄'){
                                    await axios(process.env.APP_URL+'api/negocio/update/'+msg.from)
                                    menu_negocio(msg.from)
                                }else if (msg.body === '⏪' || msg.body === '⏮️'){
                                    var cliente_update = await axios.post(process.env.APP_URL+'api/cliente/modo/cliente', {phone: msg.from})
                                    menu_principal(cliente_update, msg.from)
                                }else{
                                    client.sendMessage(msg.from, 'Interactuando como '+micliente.data.modo+'\nEstate atento al proximo pedido\nEnvia el emoji ⏪ para volver al modo Cliente.')
                                }            
                            default:
                                // client.sendMessage(msg.from, 'Intenta con otro opcion\nInteractuando como: '+micliente.data.modo)
                                break;
                        }
                    }
                // } else {
                //     if (localidades.has(msg.body.toUpperCase())) {
                //         var clientel = await axios.post(process.env.APP_URL+'api/cliente/update/localidad', {id: micliente.data.id, poblacion_id: localidades.get(msg.body.toUpperCase())})
                //         menu_principal(clientel, msg.from)
                //         status.set(msg.from, 0)
                //     } else {
                //         var mispoblaciones = await axios(process.env.APP_URL+'api/poblaciones')
                //         var list = '*En que localidad te encuentras ?*\n'
                //         list += '----------------------------------'+'\n'
                //         for (let index = 0; index < mispoblaciones.data.length; index++) {
                //             list +=  '*Z'+mispoblaciones.data[index].id+'* .- '+mispoblaciones.data[index].nombre+'\n'
                //         }
                //         list += '----------------------------------\n'
                //         list += '*Envia un opcion ejemplo: z1 o z2*'
                //         client.sendMessage(msg.from, list)
                //     }
                // }
            }else{
                if (msg.body.length >= 8) {
                    var miclienteu = await axios.post(process.env.APP_URL+'api/cliente/update/nombre', {id: micliente.data.id, nombre: msg.body})
                    menu_principal(miclienteu, msg.from)
                //     var mispoblaciones = await axios(process.env.APP_URL+'api/poblaciones')
                //     var list = '*En que localidad te encuentras ?*\n'
                //     list += '----------------------------------'+'\n'
                //     for (let index = 0; index < mispoblaciones.data.length; index++) {
                //         list +=  '*Z'+mispoblaciones.data[index].id+'* .- '+mispoblaciones.data[index].nombre+'\n'
                //     }
                //     list += '----------------------------------\n'
                //     list += '*Envia un opcion ejemplo: z1 o z2 ..*'
                //     client.sendMessage(msg.from, list)
                } else {
                    var list = '*Bienvenido*, soy el 🤖CHATBOT🤖 DE : '+process.env.APP_NAME+'\n'
                    list += '*🙋‍♀️Cual es tu Nombre Completo ?🙋‍♂️* \n'
                    list += '*8 caracteres minimo* \n'
                    client.sendMessage(msg.from, list)
                }
            }
            break;
        case 'image':
            switch (status.get(msg.from)) {
                case 1.5:// guardar comprobante para cualquier cosa....
                    var mipedido = await axios(process.env.APP_URL+'api/pedido/'+pedidos.get(msg.from))
                    var transaccion= await axios("https://modal-flask-dev-q5zse.ondigitalocean.app/consultQR?id="+mipedido.data.banipaydos.externalId)
                    if (transaccion.data.status=="EN COLA") {
                        client.sendMessage(msg.from, 'Transacción de la Venta #'+mipedido.data.id+' aún *NO Realizada*')
                        var send_negocios= await negocios_pedido(pedidos.get(msg.from))
                    } else {
                        client.sendMessage(msg.from, 'Transacción de la Venta #'+pedidos.get(msg.from)+' realizada exitosamente')
                        for (let index = 0; index < send_negocios.length; index++) {
                            mitext= ''
                            mitext+= 'El Pedido #'+pedidos.get(msg.from)+' del Cliente '+mipedido.data.cliente.nombre+'  fue pagado exitosamente por transferencia \n'
                            var telefono_negocio= '591'+send_negocios[index].telefono+'@c.us'
                            client.sendMessage(telefono_negocio, mitext)                           
                        }
                        client.sendMessage(mipedido.data.mensajero.telefono, 'El Pedido #'+pedidos.get(msg.from)+' del Cliente '+mipedido.data.cliente.nombre+'  fue pagado exitosamente por transferencia')
                        status.set(msg.from, 2)
                    }
                    break;
                default:
                    client.sendMessage(msg.from, 'Intenta con otra opcion' )
                    break;
            }
            break;
        case 'location':
            switch (status.get(msg.from)) {
                case 1.4:
                    var micart = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', {chatbot_id: msg.from})
                    if (micart.data.length != 0)
                    {
                        var micliente = await axios(process.env.APP_URL+'api/cliente/'+msg.from)
                        var midata = {
                            cliente_id: micliente.data.id,
                            latitud: msg.location.latitude,
                            longitud: msg.location.longitude
                        }
                        var miubicacion = await axios.post(process.env.APP_URL+'api/ubicacion/save', midata)
                        locations.set(msg.from, miubicacion.data.id)
                        client.sendMessage(msg.from, 'Gracias, para poder llegar mas rapido a tu ubicacion (mapa), envia una descripcion de tu ubicacion')
                        status.set(msg.from, 1.5)//estado mapa
                    } else {
                        client.sendMessage(msg.from, '*Tu carrito esta vacio*\n *A* .- TODOS LOS NEGOCIOS')
                    }
                    break;
                default:
                    break;
            }
            break;
        case 'call_log':

            break;
        default:
            break;
    }
})

app.get('/', async (req, res) => {

    res.render('index', {count: micount});
});

app.get('/chat/negocios', async (req, res) => {
    var misnegocios = await axios(process.env.APP_URL+'api/all/negocios')
    var list = 'Hola, soy el 🤖CHATBOT🤖 de '+process.env.APP_NAME+'\n'
    list += '----------------------------------\n'
    list += 'Te ofrecemos nustro servicio de Mensajeria (delivery)\n'
    list += '----------------------------------\n'
    list += 'Tambien te ayudamos con la promocion y marketing de tu negocio en la redes sociales, mas informacion con el administrador.\n'
    for (let index = 0; index < misnegocios.data.length; index++) {
        client.sendMessage(misnegocios.data[index].chatbot_id, list)
    }
    res.send('chat enviado');
});

app.post('/chat', async (req, res) => {
    var message = req.body.message ? req.body.message : req.query.message
    var phone = req.body.phone ? req.body.phone : req.query.phone
    status.set(phone, 1.1)
    var miclientelp = await axios(process.env.APP_URL+'api/cliente/'+phone)
    await cart_list(phone, miclientelp)
    client.sendMessage(phone, message)    
});

app.post('/login', async (req, res) => {
    var message = req.body.message ? req.body.message : req.query.message
    var phone = req.body.phone ? req.body.phone : req.query.phone
    client.sendMessage(phone, message)    
});

const menu_mensajero = async (phone) => {
    var michofer200 = await axios(process.env.APP_URL+'api/mensajero/'+phone)
    if (michofer200.data) {
        var miestado = michofer200.data.estado ? 'Libre' : 'Ocupado'
        var list = '*Hola*, '+michofer200.data.nombre+' (#'+michofer200.data.id+') soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente.\n'
        list += '----------------------------------\n'
        list += '*Estado :* '+miestado+'\n'
        list += '*Nombres :* '+michofer200.data.nombre+'\n'
        list += '*Localidad :* '+michofer200.data.localidad.nombre+'\n'
        list += '*Deliverys :* '+michofer200.data.pedidos.length+'\n'
        list += '----------------------------------\n'
        list += '*A* .- Ver pedidos en cola\n'
        list += '*B* .- Cambiar de estado (envia el emoji - libre/ocupado)\n'
        list += '*C* .- Volver como cliente\n'
        list += '*D* .- Obtener Credenciales\n'
        list += '----------------------------------\n'
        list += 'Panel de administracion\n'
        list += process.env.APP_URL+'admin'
        client.sendMessage(phone, list)
        status_mensajero.set(phone, 0)
    } else {
        client.sendMessage(phone, 'No se encuentra registrado como chofer, consulte con el administrador')
        var admin = await client.getContactById(process.env.CHATBOT)
        client.sendMessage(phone, admin)
    }
    return true;
}

const negocios_pedido = async(id) =>{
    var negocios3= await axios(process.env.APP_URL+'api/pedido/negocios/'+id)
    var send_negocios = []
    var searchrep = []
    for (let index = 0; index < negocios3.data.length; index++) {
        if(searchrep[index] === negocios3.data[index].negocio.id){
        }else{
            var rep=0;
            for (let j = 0; j < send_negocios.length; j++) {
                if(send_negocios[j].id==negocios3.data[index].negocio.id){
                    rep+=1;
                }                                
            }
            if(rep==0){
                send_negocios.push(negocios3.data[index].negocio)
            }
        }
        searchrep.push(negocios3.data[index].negocio.id)
    }
    return send_negocios;
}

const menu_principal = async (micliente, phone) => {
    var list = 'Hola, '+micliente.data.nombre+' soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente de ventas, visita tu negocio preferido, llena tu carrito y realiza tu pedido, (Iteracion como '+micliente.data.modo+')\n'
    list += '*🏚️ Empieza con una opcion 🏚️* \n'
    list += '----------------------------------'+' \n'
    list += '*A* .- TODOS LOS NEGOCIOS\n'
    var mitipos = await axios(process.env.APP_URL+'api/tipo/negocios')
    for (let index = 0; index < mitipos.data.length; index++) {
        list += '    *A'+mitipos.data[index].id+'* .- '+mitipos.data[index].nombre+' - ('+mitipos.data[index].negocios.length+')\n'
    }
    list += '*B* .- CAMBIAR A CHOFER/NEGOCIO\n'
    list += '*C* .- SOBRE NOSOTROS\n'
    list += 'Envia una opcion (ejemplo: A)'
    client.sendMessage(phone, list)
    return true
}

const menu_negocio = async (phone) => {
    var minegocio = await axios(process.env.APP_URL+'api/minegocio/'+phone)
    var miestado = (minegocio.data.estado === '1') ? 'Abierto' : 'Cerrado'
    var list = '*Hola*, '+minegocio.data.contacto+' soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente de ventas.\n'
    list += '----------------------------------'+' \n'
    list += '*ID :* '+minegocio.data.id+'\n'
    list += '*Mi Negocio :* '+minegocio.data.nombre+'\n'
    list += '*Localidad :* '+minegocio.data.poblacion.nombre+'\n'
    list += '*Direccion :* '+minegocio.data.direccion+'\n'
    list += '*Productos :* '+minegocio.data.productos.length+'\n'
    list += '*Contacto :* '+minegocio.data.contacto+'\n'
    list += '*Estado :* '+miestado+'\n'
    list += '----------------------------------\n'
    list += '🔄 .- Cambiar de Estado (envia el emoji - Abierto/Cerrado)\n'
    list += '⏪ .- VOLVER COMO CLIENTE\n'
    list += '----------------------------------\n'
    list += '*Mi Tienda en Linea*\n'
    list += process.env.APP_URL+'negocio/'+minegocio.data.slug
    client.sendMessage(phone, list)
    status_negocio.set(phone, 0)
    return true
}

const menu_cliente = async (phone) => {
    var miperfil = await axios(process.env.APP_URL+'api/cliente/'+phone)
    var list = '🧑‍💻 *MI PERFIL* 🧑‍💻\n'
    list += '------------------------------------------\n'
    list += '*ID :* '+miperfil.data.id+'\n'
    list += '*Nombres :* '+miperfil.data.nombre+'\n'
    list += '*Localidad :* '+miperfil.data.localidad.nombre+'\n'
    // list += '*Chatbot :* '+miperfil.data.chatbot_id+'\n'
    list += '*Registrado :* '+miperfil.data.published+'\n'
    list += '*Pedidos :* '+miperfil.data.pedidos.length+'\n'
    list += '*Mapas :* '+miperfil.data.ubicaciones.length+'\n'
    list += '------------------------------------------\n'
    list += '*📍 :* Cambiar de Localidad (envia el emoji)\n'
    list += process.env.APP_URL+'marketplace'
    client.sendMessage(phone, list)
}

const cart_list = async (phone, micliente) => {
    var miresponse = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', {chatbot_id: phone})
    var micant = await axios(process.env.APP_URL+'api/pedido/carrito/negocios/'+phone)
    if (miresponse.data.length != 0) {
        var list = '*Lista de productos en tu carrito*\n'
        var total = 0
        var total_extras = 0
        list += '------------------------------------------\n'
        for (let index = 0; index < miresponse.data.length; index++) {
            list += miresponse.data[index].cantidad+' '+miresponse.data[index].producto_name+' '+miresponse.data[index].precio+'Bs. ('+miresponse.data[index].negocio_name+')\n'    
            if (miresponse.data[index].extras.length != 0) {
                for (let j = 0; j < miresponse.data[index].extras.length; j++) {
                    var extra = await axios(process.env.APP_URL+'api/producto/extra/get/'+miresponse.data[index].extras[j].extra_id)
                    list += '   -> '+miresponse.data[index].extras[j].cantidad+' '+extra.data.nombre+' '+miresponse.data[index].extras[j].precio+'Bs. (extra)\n'
                    total_extras+= parseFloat(miresponse.data[index].extras[j].total)
                }
            }
            total += miresponse.data[index].precio * miresponse.data[index].cantidad
        }
        list += '\n❌ Envia el emoji para vaciar 🚮\n'
        list += '------------------------------------------ \n'
        list += '*PRODUCTOS* .- '+total+' Bs. \n'
        list += '*EXTRAS* .- '+total_extras+' Bs. \n'
        list += '*DELIVERY* .- '+(micant.data * parseFloat(micliente.data.localidad.tarifa))+' Bs.\n'
        list += '*TOTAL* .- '+(total + total_extras +(micant.data * parseFloat(micliente.data.localidad.tarifa)))+' Bs.'
        client.sendMessage(phone, list)
    } else {
        client.sendMessage(phone, 'Tu carrito esta vacio')
    }
}

const extras_list = async (phone) => {
    var miproducto = carts.get(phone)
    var milist = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
    var list = '*Elije un extra para agreagar a tu producto:* \n'+miproducto.nombre+'\n'
    list += '------------------------------------------\n'
    for (let index = 0; index < miproducto.extra.length; index++) {
        list += '*'+milist[index]+'* .- '+miproducto.extra[index].nombre+' ('+miproducto.extra[index].precio+'Bs.)\n'
    }
    list += 'Envia una opcion ejemplo: A'
    client.sendMessage(phone, list)
}

const extras_view = async (phone) => {
    var miprodcuto = carts.get(phone)
    var product = await axios(process.env.APP_URL+'api/producto/'+miprodcuto.id)
    var miresponse = await axios(process.env.APP_URL+'api/producto/extra/negocio/'+product.data.negocio_id)
    var list = ''
    for (let index = 0; index < miresponse.data.length; index++) {
        list += '*X'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' ('+miresponse.data[index].precio+' Bs.)\n'
        extras.set('X'+miresponse.data[index].id, miresponse.data[index].id)
    }
    client.sendMessage(phone, list)
}

const negocios_list = async (phone, micliente) =>{
    var miresponse = await axios(process.env.APP_URL+'api/negocios/'+micliente.data.poblacion_id)
    var list = '*🏚️ NEGOCIOS DISPONIBLES 🏚️* \n'
    list += micliente.data.localidad.nombre+'\n'
    list += '----------------------------------'+' \n'
    for (let index = 0; index < miresponse.data.length; index++) {
        list += '*N'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' - ('+miresponse.data[index].productos.length+')\n'
        negocios.set('N'+miresponse.data[index].id, miresponse.data[index].id);
    }
    list += 'Envia una opcion ejemplo: (N'+miresponse.data[0].id+')\n'
    list += '----------------------------------\n'
    list += 'Visita nuestro marketplace en:\n'
    list += process.env.APP_URL+'marketplace'
    client.sendMessage(phone, list)
}

const pasarelas_list = async (phone) =>{
    var pagos = await axios(process.env.APP_URL+'api/chatbot/pasarelas/get')
    var miopcion = ['A', 'B', 'C', 'D']
    var list = 'PUEDES PAGAR TU PEDIDO POR ESTOS METODOS\n'
    for (let index = 0; index < pagos.data.length; index++) {
        list += '*'+miopcion[index]+'* .- '+pagos.data[index].title+'\n'
    }
    list += '------------------------------------------\n'
    list += 'Envia una opcion'
    client.sendMessage(phone, list)
}

const finalizar = async (phone, micliente) =>{

}

client.initialize();
