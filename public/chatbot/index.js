const express = require('express');
const axios = require('axios');
const qrcode = require("qrcode-terminal");
const cors = require('cors')
const { Client, MessageMedia, LocalAuth, Location, Buttons} = require("whatsapp-web.js");

const { io } = require("socket.io-client");
const socket = io("https://socket.appxi.net");

const JSONdb = require('simple-json-db');
const { json } = require('express');
const categorias = new JSONdb('json/categorias.json');
const negocios = new JSONdb('json/negocios.json');
const productos = new JSONdb('json/productos.json');
const cupones = new JSONdb('json/cupones.json');
const carts = new JSONdb('json/carts.json');
const pasarelas = new JSONdb('json/pasarelas.json');
const sucursales = new JSONdb('json/sucursales.json');
const locations = new JSONdb('json/locations.json');
const asignaciones = new JSONdb('json/asignaciones.json');
const pedidos = new JSONdb('json/pedidos.json');

require('dotenv').config({ path: '../../.env' })

const app = express();
app.use(cors())
app.use(express.json())


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

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Nuevo QR, recuerde que se genera cada 1/2 minuto.')
});

client.on('ready', async () => {
	app.listen(process.env.CHATBOT_PORT, () => {
		console.log('CHATBOT ESTA LISTO EN EL PUERTO: '+process.env.CHATBOT_PORT);
	});
});

client.on("authenticated", () => {
});

client.on("auth_failure", msg => {
    console.error('AUTHENTICATION FAILURE', msg);

})

client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);
    console.log(msg.type)

    var micliente = await axios(process.env.APP_URL+'api/cliente/'+msg.from)
    console.log(micliente.data.nombre)
    if (micliente.data.nombre) {
        // if (micliente.data.poblacion_id) {
            if (msg.type === 'chat') {
                switch (true) {
                    case (msg.body === 'hola') || (msg.body === 'HOLA') || (msg.body === 'Hola') || (msg.body === 'Buenas')|| (msg.body === 'buenas') || (msg.body === 'BUENAS') || (msg.body === '0'):
                        menu_principal(micliente, msg.from)
                        break;
                    case (msg.body === 'A') || (msg.body === 'a'):
                        var miresponse = await axios(process.env.APP_URL+'api/negocios')
                        var list = '*🏚️ NEGOCIOS DISPONIBLES 🏚️* \n'
                        list += '----------------------------------'+' \n'
                        for (let index = 0; index < miresponse.data.length; index++) {
                            list += '*A'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' - ('+miresponse.data[index].productos.length+')\n'
                            negocios.set('A'+miresponse.data[index].id, miresponse.data[index].id);
                        }
                        list += '----------------------------------'+' \n'
                        list += '*ENVIA UNA OPCION DEL MENU ejemplo: a1 o a2..*'
                        client.sendMessage(msg.from, list).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    case negocios.has(msg.body.toUpperCase()):
                        var miresponse = await axios(process.env.APP_URL+'api/filtros/'+negocios.get(msg.body.toUpperCase()))
                        var minegocio = miresponse.data[0].negocio
                        var miestado = (miresponse.data[0].negocio.estado == 1) ? 'Abierto' : 'Cerrado'
                        var list = '*'+minegocio.nombre+'*\n'
                        list += '----------------------------------'+'\n'
                        list += 'Estado : '+miestado+'\n'
                        list += 'Horario : '+minegocio.horario+'\n'
                        list += 'Direccion : '+minegocio.direccion+'\n'
                        list += '----------------------------------'+'\n'
                        list += '*MENU DEL DIA*\n'
                        for (let index = 0; index < miresponse.data.length; index++) {
                            list += '*B'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' - *('+miresponse.data[index].precio+' Bs.)*\n'
                            productos.set('B'+miresponse.data[index].id, miresponse.data[index].id)
    
                        }
                        list += '----------------------------------'+'\n'        
                        list += '*ENVIA UNA OPCION ejemplo: b1 o b2 ..*\n'
                        var mimedia = minegocio.logo ? MessageMedia.fromFilePath('../../storage/app/public/'+minegocio.logo) : MessageMedia.fromFilePath('imgs/mitienda.png');
                        client.sendMessage(msg.from, mimedia, {caption: list}).then((response) => {
                            if (response.id.fromMe) {
                                console.log("image fue enviado!");
                            }
                        })
                        break;
                    case (msg.body === 'B') || (msg.body === 'b'):
                        var miresponse = await axios(process.env.APP_URL+'api/productos')
                        var list = '*TODOS LOS PRODUCTOS* \n'
                        list += '--------------------------------------------\n'
                        for (let index = 0; index < miresponse.data.length; index++) {
                            list += '*B'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' - ('+miresponse.data[index].precio+' Bs.) '+miresponse.data[index].negocio.nombre+'\n'
                            productos.set('B'+miresponse.data[index].id, miresponse.data[index].id)
                        }
                        list += '--------------------------------------------\n'
                        list += '*ENVIA UNA OPCION DEL MENU ejemplo: b1 o b2 ..*'
                        client.sendMessage(msg.from, list).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    case productos.has(msg.body.toUpperCase()):
                            var miresponse = await axios(process.env.APP_URL+'api/producto/'+productos.get(msg.body.toUpperCase()))
                            let media = ''
                            if (miresponse.data.image) {
                                media = MessageMedia.fromFilePath('../../storage/app/public/'+miresponse.data.image)
                            } else {
                                media = MessageMedia.fromFilePath('imgs/default.png');
                            }
                            var categoria = miresponse.data.categoria ? miresponse.data.categoria.nombre : 'categoria no registrada'
                            var list = '*CODIGO* B'+miresponse.data.id+'\n'
                            list += '*NOMBRE* .- '+miresponse.data.nombre+'\n'
                            list += '*DETALLE* .- '+miresponse.data.detalle+'\n'
                            list += '*PRECIO* .- '+miresponse.data.precio+' Bs.\n'
                            list += '--------------------------'+'\n'
                            list += '*A'+miresponse.data.negocio.id+' - NEGOCIO* .- '+miresponse.data.negocio.nombre+'\n'
                            list += '--------------------------'+'\n'
                            list += '*Y* .- AÑADIR A CARRITO\n'
                            list += '*B* .- TODOS LOS PRODUCTOS\n'
                            list += '*0* .- VOLVER A MENU PRINCIPAL\n'
                            list += '--------------------------'+'\n'
                            list += '*ENVIA UNA OPCION ejemplo: y o b ..*'
                            client.sendMessage(msg.from, media, {caption: list}).then((response) => {
                                if (response.id.fromMe) {console.log("text fue enviado!")
                                }
                            })
                            carts.set(msg.from, miresponse.data.id)
                            break;
                    case (msg.body === 'C') || (msg.body === 'c'):
                        var list = '*INGRESA UN CRITERIO DE BUSQUEDA* \n'
                        list += 'con el siguiente formato: *$mi busqueda o $producto1* ..'
                        let media3 = MessageMedia.fromFilePath('imgs/search.gif')
                        client.sendMessage(msg.from, media3, {caption: list}).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    case (msg.body.substring(0, 1) === '$'):
                        var misearch = msg.body.substring(1, 99)
                        var miresponse = await axios.post(process.env.APP_URL+'api/chatbot/search', {misearch: misearch})
                        var list = miresponse.data.length+' *Resultados de la busqueda :* "'+misearch+'" \n'
                        list += '------------------------------------------ \n'
                        if (miresponse.data.length === 0) {
                            list += 'No se encontraron coincidencias, prueba con otro criterio de busqueda.'
                            client.sendMessage(msg.from, list).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        } else {
                            for (let index = 0; index < miresponse.data.length; index++) {
                                list += '*CODIGO* .- B'+miresponse.data[index].id+' \n'
                                list += '*NOMBRE* .- '+miresponse.data[index].nombre+' \n'
                                list += '*DETALE* .- '+miresponse.data[index].detalle+' \n'
                                list += '*CATEGORIA* .- '+categoria+' \n'
                                list += '*PRECIO* .- '+miresponse.data[index].precio+' Bs. \n'
                                list += '*STOCK* .- '+miresponse.data[index].stock+' \n'
                                list += '------------------------------------------ \n'
                            }
                            list += '*Envia el CODIGO del producto para agregar a tu carrito.*'
                            client.sendMessage(msg.from, list).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        }
                        var midata = {
                            phone: msg.from,
                            message: list
                        }
                        // await axios.post(process.env.APP_URL+'api/chatbot/save/out', midata)
                        // socket.emit("chatbot", msg.from)
                        break;
                    case (msg.body === 'D') || (msg.body === 'd'):
                        var midata = {
                            chatbot_id: msg.from
                        }
                        var miresponse = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', midata)
                        var micant = await axios(process.env.APP_URL+'api/pedido/carrito/negocios/'+msg.from)
                        if (miresponse.data.length != 0) {
                            var list = '🛒*Lista de productos en tu carrito*🛒 \n'
                            var total = 0
                            list += '------------------------------------------ \n'
                            for (let index = 0; index < miresponse.data.length; index++) {
                                list += '*CODIGO* .- B'+miresponse.data[index].producto_id+' \n'
                                list += '*NOMBRE* .- '+miresponse.data[index].producto.nombre+' \n'
                                list += '*DETALLE* .- '+miresponse.data[index].producto.detalle+' \n'
                                list += '*PRECIO* .- '+miresponse.data[index].producto.precio+' Bs.\n'
                                list += '*CANTIDAD* .- '+miresponse.data[index].cantidad+' \n'
                                list += '*NEGOCIO* .- '+miresponse.data[index].negocio_name+'\n'
                                list += '------------------------------------------ \n'
                                total += miresponse.data[index].producto.precio * miresponse.data[index].cantidad
                            }
                            list += '*-----TOTALES-----*\n'
                            list += '*PRODUCTOS* .- '+total+' Bs. \n'
                            list += '*DELIVERY* .- '+(micant.data * process.env.COMISION)+' Bs. \n'
                            list += '*TOTAL* .- '+(total + (micant.data * process.env.COMISION))+' Bs. \n'
                            list += '------------------------------------------ \n'
                            list += '*G* .- Enviar pedido \n'
                            list += '*H* .- Vaciar Carrito \n'
                            list += '*0* .- MENU PRINCIPAL \n'
                            list += '*ENVIA UNA OPCION ejemplo: y o b ..*'
                            client.sendMessage(msg.from, list).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        } else {
                            client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL').then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        }
                        break;
                    case pasarelas.has(msg.body.toUpperCase()): // FIN DEL FLUJO
                        var miresponse = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', {chatbot_id: msg.from})
                        if (miresponse.data.length != 0) {
                            var micliente = await axios(process.env.APP_URL+'api/cliente/'+msg.from)
                            var mediag = MessageMedia.fromFilePath('imgs/gracias.gif')
                      
                            //registro del pedido-----
                            var midata = {
                                chatbot_id: msg.from,
                                pago_id: msg.body.substring(1, 99),
                                cliente_id: micliente.data.id,
                                ubicacion_id: locations.get(msg.from)
                            }
                            var miventa = await axios.post(process.env.APP_URL+'api/chatbot/venta/save', midata)
                            // set.pedidos(miventa.data.chatbot_id, miventa.data.id)
                            var list = '🕦 *Pedido #'+miventa.data.id+' Enviado* 🕦 \n Se te notificará el proceso de tu pedido, por este mismo medio. \n 🎉 *GRACIAS POR TU PREFERENCIA* \n🎉'
                            list += '------------------------------------------\n'
                            list += 'envia la la palabra perfil, para ver tus pedidos'
                            client.sendMessage(msg.from, mediag, {caption: list}).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
    
                            //var mipedido = axios(process.env.APP_URL+'api/pedido/'+miventa.data.id) 
                            //crear banipay del pedido-----
                            // var micart = []
                            // for (let index = 0; index < miresponse.data.length; index++) {
                            //     micart.push({"concept": miresponse.data[index].name, "quantity": miresponse.data[index].cant, "unitPrice": miresponse.data[index].precio})
                            // }
                            // var miconfig = {
                            //         "affiliateCode": process.env.BANIPAY_CODE,
                            //         "notificationUrl": "#",
                            //         "withInvoice": false,
                            //         "externalCode": miventa.data.id,
                            //         "paymentDescription": "Pago por servicios de DELIVERY",
                            //         "details": [],
                            //         "postalCode": "Bolivianos"
                            //       }
                            //  var banipay = await axios.post('https://banipay.me:8443/api/payments/transaction', miconfig)
                            //https://banipay.me/super/payment
    
                            //PEDIDO DEL CLIENTE (estaba antes en ENVIAR PEDIDOS A MENSAJEROS)
                            var mipedido = await axios(process.env.APP_URL+'api/pedido/'+miventa.data.id)
    
    
                            //ENVIAR PEDIDOS A NEGOCIOS----
    
                            //Lógica para Agrupar Negocios
                            var negocios3= await axios(process.env.APP_URL+'api/pedido/negocios/'+miventa.data.id)
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
                            // send_negocios=await negocios_pedido(miventa.data.id)
                            
                            //Lógica para Agrupar y enviar Pedidos por Negocio
                            for (let index = 0; index < send_negocios.length; index++) {
                                var total_pedido_actual=0;
                                var mismg=''
                                mismg += 'Hola, '+negocios3.data[index].negocio_name+' tienes un pedido solicitado, con el siguiente detalle: \n'
                                mismg += '------------------------------------------\n'
                                mismg += 'Pedido #: '+negocios3.data[index].pedido_id+'\n'
                                mismg += 'Cliente: '+mipedido.data.cliente.nombre+'\n'
                                mismg += 'Fecha: '+negocios3.data[index].published+'\n'
                                mismg += '------------------------------------------\n'
                                for (let j = 0; j < negocios3.data.length; j++) {
                                    if (send_negocios[index].id== negocios3.data[j].negocio.id) {
                                        total_pedido_actual+=negocios3.data[j].total
                                        mismg += 'Producto: '+negocios3.data[j].producto_name+'\n'
                                        mismg += 'Cantidad: '+negocios3.data[j].cantidad+'\n'
                                        mismg += 'Precio: '+negocios3.data[j].precio+' Bs.\n'
                                        mismg += 'SubTotal: '+negocios3.data[j].total+' Bs.\n'
                                        mismg += '------------------------------------------\n'
                                        var telef_negocio=negocios3.data[j].negocio.telefono
                                        var telef_negocio='591'+telef_negocio+'@c.us'
                                    }
                                }
                                mismg += 'Total: '+total_pedido_actual+' Bs.\n'
                                mismg += 'La asignación a un Delivery está en proceso, ve realizando el pedido porfavor.'
                                client.sendMessage(telef_negocio, mismg).then((response) => {
                                    if (response.id.fromMe) {
                                        console.log("text fue enviado!");
                                    }
                                })
                            }
    
                            //ENVIAR PEDIDOS A MENSAJEROS-----
                            ubic_cliente=''
                            ubic_cliente +='Ubicación del Cliente: '+mipedido.data.cliente.nombre+'\n'
                            ubic_cliente +=mipedido.data.ubicacion.detalles
                            const locationcliente = new Location(mipedido.data.ubicacion.latitud, mipedido.data.ubicacion.longitud, ubic_cliente);
                            var mensajeroslibre = await axios(process.env.APP_URL+'api/mensajeros/libre')
                           
                            console.log(mensajeroslibre.data)
                            for (let index = 0; index < mensajeroslibre.data.length; index++) {   
                                var total_mensajero = 0
                                var cantidad_mensajero = 0 
                                var mitext = '' 
                                mitext += 'Hola, '+mensajeroslibre.data[index].nombre+' hay un pedido disponible con el siguiente detalle:\n'                       
                                mitext += '------------------------------------------\n'
                                mitext += 'ID: '+mipedido.data.id+'\n'
                                mitext += 'Cliente: '+mipedido.data.cliente.nombre+'\n'
                                mitext += 'Fecha: '+mipedido.data.published+'\n'
                                mitext += '----- *PRODUCTOS* -----\n'
                                for (let j = 0; j < mipedido.data.productos.length; j++) {
                                    mitext += 'NOMBRE: '+mipedido.data.productos[j].producto_name+'\n'
                                    mitext += 'PRECIO : '+mipedido.data.productos[j].precio+' Bs.\n'
                                    mitext += 'CANT : '+mipedido.data.productos[j].cantidad+'\n'
                                    mitext += 'NEGOCIO : '+mipedido.data.productos[j].negocio_name+'\n\n'
                                    total_mensajero += mipedido.data.productos[j].total 
                                    cantidad_mensajero += mipedido.data.productos[j].cantidad
                                }
                                mitext += '----- *TOTALES* -----\n'
                                mitext += 'Productos: '+cantidad_mensajero+'\n'
                                mitext += 'Delivery: '+((send_negocios.length)*process.env.COMISION)+'\n'
                                mitext += 'Total: '+(total_mensajero+((send_negocios.length)*process.env.COMISION))+' Bs.\n'
                                mitext += '------------------------------------------\n'
                               
                                client.sendMessage(mensajeroslibre.data[index].telefono, mitext).then((response) => {
                                    if (response.id.fromMe) {
                                        console.log("text fue enviado!");
                                    }
                                })
    
                                for (let j = 0; j < send_negocios.length; j++) {
                                    var mitexto=''
                                    mitexto +='Ubicación del Negocio: '+send_negocios[j].nombre+'\n'
                                    // client.sendMessage(mensajeroslibre.data[index].telefono, mitexto).then((response) => {
                                    //     if (response.id.fromMe) {
                                    //         console.log("text fue enviado!");
                                    //     }
                                    // })
                                    mitexto +=send_negocios[j].direccion   
                                    const locationnegocio = new Location(parseFloat(send_negocios[j].latitud), parseFloat(send_negocios[j].longitud), mitexto);
                                    client.sendMessage(mensajeroslibre.data[index].telefono, locationnegocio).then((response) => {
                                        if (response.id.fromMe) {
                                            console.log("ubicacion fue enviada!");
                                        }
                                    })
                                }
                               
                                client.sendMessage(mensajeroslibre.data[index].telefono, locationcliente).then((response) => {
                                    if (response.id.fromMe) {
                                        console.log("ubicacion fue enviada!");
                                    }
                                })
    
                                var mitext = '' 
                                mitext += '*QUIERES TOMAR EL PEDIDO #'+mipedido.data.id+' ?* \n'
                                mitext += 'Envia  *='+mipedido.data.id+'* para confirmar. \n'
                                client.sendMessage(mensajeroslibre.data[index].telefono, mitext).then((response) => {
                                    if (response.id.fromMe) {
                                        console.log("text fue enviado!");
                                    }
                                })
    
                                // client.sendMessage(mensajeroslibre.data[index].telefono, new Buttons('Body text/ MessageMedia instance', [{id:'customId',body:'button1'},{body:'button2'},{body:'button3'},{body:'button4'}], 'Title here, doesn\'t work with media', 'Footer here'), {caption: 'if you used a MessageMedia instance, use the caption here'})
    
                                // client.sendMessage(mensajeroslibre.data[index].telefono, new List('Body text/ MessageMedia instance', 'List message button text', [{title: 'sectionTitle', rows: [{id: 'customId', title: 'ListItem2', description: 'desc'}, {title: 'ListItem2'}]}], 'Title here, doesn\'t work with media', 'Footer here'), {caption: 'if you used a MessageMedia instance, use the caption here'})
                            }
                            }else {
                                client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL').then((response) => {
                                    if (response.id.fromMe) {
                                        console.log("text fue enviado!");
                                    }
                                })
                            }
                        break;
                    case (msg.body === 'G') || (msg.body === 'g'):
                        var micart = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', {chatbot_id: msg.from})
                        if (micart.data.length != 0)
                        {
                            var mimedia = MessageMedia.fromFilePath('../../storage/app/public/location.jpg')
                            client.sendMessage(msg.from, mimedia, {caption: '🗺️ Genial, ahora necesitamos tu ubicacion, para enviar tu pedido 🗺️\nEnvia tu ubicacion actual (un mapa) por favor.'}).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        } else {
                            client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL').then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        }
                        break;
                    case (msg.body === 'H') || (msg.body === 'h'):
                        var midata = {
                            chatbot_id: msg.from
                        }
                    await axios.post(process.env.APP_URL+'api/chatbot/cart/clean', midata)
                        client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL').then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    case (msg.body === 'y') || (msg.body === 'Y'):
                        client.sendMessage(msg.from, 'Genial ✌, Ingresa una cantidad para agragar a tu carrito\ncon el formato: *+1 o +2 ..*').then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    case (msg.body === 'v') || (msg.body === 'V'):
                        const mediav = await MessageMedia.fromUrl('https://delivery.appxi.net//storage/videos/demostrativo.mp4');
                        client.sendMessage(msg.from, mediav).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    case (msg.body === 'm') || (msg.body === 'M'):
                        var minegocio = await axios(process.env.APP_URL+'api/minegocio/'+msg.from)
                        console.log(minegocio.data)
                        if (minegocio.data) {
                            menu_negocio(minegocio, msg.from)
                        } else {
                            client.sendMessage(msg.from, 'No tiene registrado un negocio con nosotros, contactese con el administrador')
                            client.sendMessage(msg.from, process.env.CHATBOT)
                        }
                        
                        break;
                    case (msg.body.substring(0, 1) === '+'):           
                        var cant = msg.body.substring(1, 99)
                        var product_id = carts.get(msg.from)
                        var product = await axios(process.env.APP_URL+'api/producto/'+product_id)
                        var minegocio = await axios(process.env.APP_URL+'api/negocio/'+product.data.negocio.id)
                        console.log(minegocio.data.estado)
                        if (minegocio.data.estado === '1') {            
                            var midata = {
                                product_id: product.data.id,
                                product_name: product.data.nombre,
                                chatbot_id: msg.from,
                                precio: product.data.precio,
                                cantidad: cant,
                                negocio_id: product.data.negocio.id,
                                negocio_name: product.data.negocio.nombre
                            }
                            await axios.post(process.env.APP_URL+'api/chatbot/cart/add', midata)
                            var list = '🎉 Producto agregado a tu carrito 🎉\n'
                            list += '------------------------------------------\n'
                            list += '*D* .- VER MI CARRITO\n'
                            list += '*G* .- Enviar pedido\n'
                            list += '*0* .- MENU PRINCIPAL\n'
                            list += '------------------------------------------\n'
                            list += '*ENVIA UNA OPCION ejemplo: f o g ..*'
                            client.sendMessage(msg.from, list).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        } else {
                            client.sendMessage(msg.from, '❌Lo lamento el negocio esta cerrado❌').then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        }
                        break;
                    case (msg.body === 'E') || (msg.body === 'e') || (msg.body === 'Perfil') || (msg.body === 'perfil') || (msg.body === 'miperfil') || (msg.body === 'Miperfil') || (msg.body === 'Mi Perfil') || (msg.body === 'mi perfil'):
                        var miperfil = await axios(process.env.APP_URL+'api/cliente/'+msg.from)
                        var list = '🧑‍💻 *MI PERFIL* 🧑‍💻\n'
                        list += '------------------------------------------\n'
                        list += 'ID : '+miperfil.data.id+'\n'
                        list += 'Nombres : '+miperfil.data.nombre+'\n'
                        list += 'Telefono : '+miperfil.data.chatbot_id+'\n'
                        list += '------------------------------------------\n'
                        list += '*✍️* .- Historial de Pedidos\n'
                        list += '------------------------------------------\n'
                        client.sendMessage(msg.from, list).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    case (msg.body.substring(0, 1) === '#'):
                        var midescription = msg.body.substring(1, 99)
                        var milocation = locations.get(msg.from)
                        await axios.post(process.env.APP_URL+'api/ubicacion/update', {id: milocation, detalle: midescription})
                        
                        var pagos = await axios(process.env.APP_URL+'api/chatbot/pasarelas/get')
                        var list = '*Gracias, PUEDES PAGAR TU PEDIDO POR ESTOS METODOS*\n'
                        list += '------------------------------------------ \n'
                        for (let index = 0; index < pagos.data.length; index++) {
                            list += '*P'+pagos.data[index].id+'* .- '+pagos.data[index].title+'\n'
                            pasarelas.set('P'+pagos.data[index].id, pagos.data[index].id)
                        }
                        list += '------------------------------------------ \n'
                        list += 'Genial ✌ como quieres pagar tu pedido ? envia *p1 o p2* .. para confirmar tu pedido.'
                        client.sendMessage(msg.from, list).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    //Estado del Pedido Asignado
                    case (msg.body.substring(0, 1) === '='):
                        var midescription = msg.body.substring(1, 99)
                        var midata = {
                            telefono: msg.from,
                            pedido_id: midescription
                        }
                        var asignar = await axios.post(process.env.APP_URL+'api/asignar/pedido', midata)
                        if (asignar.data) {
                            var mitext=''
                            mitext+= 'Pedido #'+midescription+' Asignado Correctamente\n'
                            mitext+= 'Porfavor, proceda a ir lo antes posible a recoger el pedido a los negocios respectivos\n'
                            mitext+= 'Una vez que tenga el pedido completo, envíe */'+midescription+'* para confirmar el estado.\n'
                            mitext+= 'Luego envíe su *Ubicación en Tiempo Real* al Cliente porfavor\n'
                            mitext+= '------------------------------------------\n'
                            mitext+= 'Envíe: *?* seguido de una descripción para cancelar su servicio por algún motivo si es que fue antes de recoger el pedido.\n'
                            mitext+= 'Ejemplo: *?Se me pinchó la llanta*\n'
                            mitext+= 'Si ya recogió el pedido usted tiene total responsabilidad del mismo.\n'
                        
                            client.sendMessage(msg.from, mitext).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                            var pedido= await axios(process.env.APP_URL+'api/pedido/'+midescription)
                            var contacto_cliente= await client.getContactById(pedido.data.cliente.chatbot_id)
                            client.sendMessage(msg.from, contacto_cliente);
                            var mitext=''
                            mitext += 'Su pedido fue asignado al Delivery: '+pedido.data.mensajero.nombre+'\n'
                            mitext += 'Le avisaremos cuando el Delivery tenga su Pedido\n'
                            mitext += 'Una vez le llegue el pedido, envíe *%'+midescription+'* para confirmar porfavor.\n'
                            client.sendMessage(pedido.data.chatbot_id, mitext).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
    
                            var send_negocios= await negocios_pedido(midescription)
                            for (let index = 0; index < send_negocios.length; index++) {
                                mitext= ''
                                mitext+= 'El Delivery: '+pedido.data.mensajero.nombre+' será el encargado de recoger el pedido #'+midescription+'\n'
                                var telefono_negocio= '591'+send_negocios.data[index].telefono+'@c.us'
                                client.sendMessage(telefono_negocio, mitext).then((response) => {
                                    if (response.id.fromMe) {
                                        console.log("text fue enviado!");
                                    }
                                })                            
                            }
                        } else {
                            client.sendMessage(msg.from, 'El pedido #'+midescription+' ya está asignado a otro Delivery, intenta con otro pedido.').then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        }
    
                        break;
    
                    //Estado del Pedido Cancelado
                    case (msg.body.substring(0, 1) === '?'):
                        var midescription = msg.body.substring(1, 99)
                        var midata = {
                            telefono: msg.from,
                        }
                        var pedido_cancelado= await axios.post(process.env.APP_URL+'api/cancelar/pedido', midata)
                        if (pedido_cancelado) {
                            $chofer= await axios(process.env.APP_URL+'api/search/mensajero/'+pedido_cancelado.data.mensajero_id)
                            client.sendMessage(msg.from, 'Pedido #'+pedido_cancelado.data.id+' cancelado esperamos que resuelva lo mas pronto posible sus inconvenientes.').then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
    
                            //Mensaje al Cliente de que su pedido fue cancelado
                            var mitext=''
                            mitext+= 'Su pedido #'+pedido_cancelado.data.id+' ha sido cancelado por el chofer '+pedido_cancelado.data.mensajero.nombre+'\n'
                            mitext+= 'El motivo fue el siguiente: '+midescription+'\n'
                            mitext+= 'Estamos buscando otro chofer para llevar su pedido, lamentamos los inconvenientes.'
                            client.sendMessage(pedido_cancelado.data.cliente.chatbot_id, mitext).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                            //Envío a los mensajeros que el pedido está libre nuevamente
                            var mensajeroslibre = await axios(process.env.APP_URL+'api/mensajeros/libre')
                            for (let index = 0; index < mensajeroslibre.data.length; index++) {
                                console.log(mensajeroslibre.data[index].telefono)
                                if(mensajeroslibre.data[index].telefono != msg.from){    
                                var mitext = '' 
                                mitext += 'Hola, '+mensajeroslibre.data[index].nombre+' el pedido #'+pedido_cancelado.data.id+' está disponible nuevamente,\n'
                                mitext += 'si aun deseas tomar el pedido para llevarlo a su destino envía: *='+pedido_cancelado.data.id+'*\n'
                                client.sendMessage(mensajeroslibre.data[index].telefono, mitext).then((response) => {
                                    if (response.id.fromMe) {
                                        console.log("text fue enviado!");
                                    }
                                })
                                }
                            }
                            
                        }
                        else{
                            client.sendMessage(msg.from, 'Usted no tiene un pedido asignado para cancelarlo').then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        }
                        break;
                    //Estado del Pedido Llevando
                    case (msg.body.substring(0, 1) === '/'):
                        var midescription = msg.body.substring(1, 99)
                        var pedido= await axios(process.env.APP_URL+'api/llevando/pedido/'+midescription)
                        var mitext=''
                        mitext += 'Hola '+pedido.data.mensajero.nombre+'\n'
                        mitext += 'recogiste el pedido y lo estás llevando hasta el cliente '+pedido.data.cliente.nombre+'\n'
                        mitext += 'Una vez sea entregado correctamente envíe *%'+pedido.data.id+'* para confirmar porfavor.\n'
                        client.sendMessage(msg.from, mitext).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        mitext=''
                        mitext += 'Su pedido ya fue entregado a su Delivery asignado y está siendo llevado a su Domicilio.\n'
                        mitext += 'Porfavor, esté atento.\n'
                        mitext += 'Una vez le llegue el pedido envíe *%'+pedido.data.id+'* para confirmar porfavor.\n'
                        client.sendMessage(pedido.data.chatbot_id, mitext).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
    
                    //Estado del Pedido Entregado
                    case (msg.body.substring(0, 1) === '%'):
                        var midescription = msg.body.substring(1, 99)
                        var pedido= await axios(process.env.APP_URL+'api/entregando/pedido/'+midescription)
    
                        var mitext=''
                        mitext += 'Hola '+pedido.data.mensajero.nombre+'\n'
                        mitext += 'El pedido #'+midescription+' fue entregado al cliente '+pedido.data.cliente.nombre+' correctamente\n'
                        mitext += 'Estás libre y habilitado para realizar mas Deliverys.\n'
                        client.sendMessage(pedido.data.mensajero.telefono, mitext).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        menu_mensajero(pedido.data.mensajero.telefono)
                        mitext=''
                        mitext += 'Su pedido ya fue entregado a su persona en su Domicilio.\n'
                        mitext += 'Esperamos que el servicio haya sido de su agrado.\n'
                        mitext += 'Que tenga Buen provecho le desea Go Delivery.\n'
                        mitext += '------------------------------------------ \n'
                        mitext += 'Si tienes alguna queja o sugerencia puedes enviarla de la siguiente forma:\n'
                        mitext += 'Ejemplo 1: &Mi pedido llegó...\n'
                        mitext += 'Ejemplo 2: &Quisiera que adicionen a su servicio...'
                        client.sendMessage(pedido.data.chatbot_id, mitext).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    //Queja o sugerencia del Pedido
                    case (msg.body.substring(0, 1) === '&'):
                        var midescription = msg.body.substring(1, 99)
                        var midata = {
                            telefono: msg.from,
                            description: midescription
                        }
                        var pedido_comentario= await axios.post(process.env.APP_URL+'api/pedido/comentario', midata)
                        if (pedido_comentario.data) {
                            var mitext=''
                            mitext+= 'Su comentario: '+midescription+' respecto a su pedido #'+pedido_comentario.data.id+' \n'
                            mitext+= 'fue registrado exitosamente y se le dará respuesta lo mas pronto posible.\n'
                            mitext+= 'Gracias por utilizar Go Delivery\n'
                            client.sendMessage(msg.from, mitext).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        } else {
                            var mitext=''
                            mitext+= 'Hola, de momento no tienes pedidos registrados, puedes realizar uno cuando gustes.\n'
                            mitext+= 'Envía: Hola para ver el Menú Principal\n'
                            client.sendMessage(msg.from, mitext).then((response) => {
                                if (response.id.fromMe) {
                                    console.log("text fue enviado!");
                                }
                            })
                        }
                        break;
                    case (msg.body === 'test'):
    
                            break;
                    case (msg.body === 'boton'):
                        var button2 = new Buttons("teste", [{id: "event_yes", body: "SI"}, {id: "event_no", body: "NO"}], "hola! Evento", "Seleciona una opcion")
                        client.sendMessage(msg.from, button2);
                        break;
                    case (msg.body === 'mapa'):
                        const location = new Location(-14.5651251, -64.5648484, 'mi mapa');
                        client.sendMessage(msg.from, location);
                        break;
                    case (msg.body === 'f') || (msg.body === 'F'):
                        menu_mensajero(msg.from)
                        break;
                    case (msg.body === '🤝'):
                        await axios(process.env.APP_URL+'api/mensajero/update/'+msg.from)
                        client.sendMessage(msg.from, 'Estado Cambiado').then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                                menu_mensajero(msg.from)
                            }
                        })
                        break;
                    case (msg.body === '🔄'):
                        var minegocio = await axios(process.env.APP_URL+'api/negocio/update/'+msg.from)
                        client.sendMessage(msg.from, 'Estado Cambiado').then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                                // menu_mensajero(msg.from)
                                menu_negocio(minegocio, msg.from)
                            }
                        })
                        break;
                    case (msg.body === '🤟'):
                        var mipedidos = await axios(process.env.APP_URL+'api/mensajero/pedidos/'+msg.from)
                        console.log(mipedidos.data)
                        var list = '*🛒 PEDIDOS ASIGNADOS 🛒* \n'
                        list += '----------------------------------'+' \n'
                        for (let index = 0; index < mipedidos.data.length; index++) {
                            // const element = array[index];
                            list += '*ID:* '+mipedidos.data[index].id+' \n'
                            list += '*Fecha:* '+mipedidos.data[index].published+' \n'
                            list += '*Estado:* '+mipedidos.data[index].estado.nombre+' \n'
                            list += '*Cliente:* '+mipedidos.data[index].cliente.nombre+' \n'
                            list += '*Pasarela:* '+mipedidos.data[index].pasarela.title+' \n'
                            list += '*-----Productos-----*\n'
                            for (let j = 0; j < mipedidos.data[index].productos.length; j++) {
                                list += '----- *ID* :'+(j+1)+'-----\n'
                                // list += '*ID* : '+mipedidos.data[index].productos[j].producto_id+'\n'
                                list += '*Nombre* : '+mipedidos.data[index].productos[j].producto_name+'\n'
                                list += '*Precio* : '+mipedidos.data[index].productos[j].precio+'\n'
                                list += '*Cantidad* : '+mipedidos.data[index].productos[j].cantidad+'\n'
                            }
                            list += '------------------------------------------\n'
                            // list += '*Total* : '+mipedidos.data[index].productos[j].cantidad+'\n'
                            // list += '*Cantidad* : '+mipedidos.data[index].productos[j].cantidad+'\n'
                        }
                        client.sendMessage(msg.from, list).then((response) => {
                            if (response.id.fromMe) {
                                console.log("text fue enviado!");
                            }
                        })
                        break;
                    default:
                    break;
                }
            }else if (msg.type === 'location') {
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
    
                    client.sendMessage(msg.from, 'Para poder llegar mas rapido tu ubicacion (mapa), envia una descripcion de tu locacion, ejemplo: *#lado del tanque elevado*\npor delante el simbolo *#*').then((response) => {
                        if (response.id.fromMe) {
                            console.log("text fue enviado!");
                        }
                    })
                } else {
                    client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL').then((response) => {
                        if (response.id.fromMe) {
                            console.log("text fue enviado!");
                        }
                    })
                }
            }else if(msg.type === 'call_log'){
                client.sendMessage(process.env.CHATBOT, 'Tienes una llamada perdida del #'+msg.from).then((response) => {
                    if (response.id.fromMe) {
                        console.log("text fue enviado!");
                    }
                })
            }
        // } else {`
        //     var mispoblaciones = await axios(process.env.APP_URL+'api/poblaciones')
        //     var list = '*En que poblacion te encuentras ?*\n'
        //     list += '----------------------------------'+'\n'
        //     for (let index = 0; index < mispoblaciones.data.length; index++) {
        //         list +=  '*Z'+mispoblaciones.data[index].id+'* .- '+mispoblaciones.data[index].nombre+'\n'
        //     }
        //     list += '----------------------------------'
        //     client.sendMessage(msg.from, list)
        // }
    }else{
        // console.log(msg.body.length)
        if (msg.body.length >= 8) {
            var micliente = await axios.post(process.env.APP_URL+'api/cliente/update', {id: micliente.data.id, nombre: msg.body})
            var list = '*Hola*, '+micliente.data.nombre+' soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente de ventas.\n'
            list += '*COMO TE PUEDO AYUDAR ?* \n'
            list += '----------------------------------'+' \n'
            list += '*A* .- TODOS LOS NEGOCIOS \n'
            list += '*B* .- TODOS LOS PRODUCTOS \n'
            list += '*C* .- BUSCAR UN PRODUCTO \n'
            list += '*D* .- VER MI CARRITO \n'
            list += '*E* .- VER MI PERFIL \n'
            list += '----------------------------------'+' \n'
            list += '*ENVIA UNA OPCION DEL MENU ejemplo: a o b ..*'
            client.sendMessage(msg.from, list).then((response) => {
                if (response.id.fromMe) {
                    console.log("text fue enviado!");
                }
            })
        } else {
            var list = '*Hola*, soy el 🤖CHATBOT🤖 DEL NEGOCIO : '+process.env.APP_NAME+' \n'
            list += '*Cual es tu Nombre Completo ?* \n'
            list += '*8 caracteres minimo* \n'
            client.sendMessage(msg.from, list).then((response) => {
                if (response.id.fromMe) {
                    console.log("text fue enviado!");
                }
            })
        }
    }
});
app.get('/', async (req, res) => {
    res.send('CHATBOT');
  });

  app.post('/chat', async (req, res) => {
    console.log(req.query)
    console.log(req.body)
    var type = req.body.type ? req.body.type : req.query.phone
    var message = req.body.message ? req.body.message : req.query.message
    var phone = req.body.phone ? req.body.phone : req.query.phone

    //res.send(req.body.type)
    if (type == 'text') {
        client.sendMessage(phone, message).then((response) => {
            if (response.id.fromMe) {
                console.log("text fue enviado!");
                //res.send('text enviado');
            }
        })
    }else if (type == 'galery') {
        // const media = MessageMedia.fromFilePath(req.query.attachment);
        // client.sendMessage(req.query.phone, media, {caption: req.query.message}).then((response) => {
        //     if (response.id.fromMe) {
        //         console.log("galery fue enviado!");
        //     }
        // });
    }else if (type == 'pin') {
        client.sendMessage(phone, message).then((response) => {
            if (response.id.fromMe) {
                console.log("pin fue enviado!");
            }
        })
    }
    res.send('CHAT');
  });

  const menu_mensajero = async (phone) => {
    var michofer200 = await axios(process.env.APP_URL+'api/mensajero/'+phone)
    if (michofer200.data) {
        var miestado = michofer200.data.estado ? 'Libre' : 'Ocupado'
        var list = '*Hola*, '+michofer200.data.nombre+' soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente.\n'
        list += '*Estado :* '+miestado+'\n'
        list += '*Whatsapp :* '+michofer200.data.telefono+'\n'
        list += '*MENU DELIVERY* \n'
        list += '----------------------------------'+' \n'
        list += '*🤟* .- HISTORIAL \n'
        list += '*🤝* .- Cambiar de Estado\n'
        list += '----------------------------------'+' \n'
        list += '*ENVIA UNA OPCION DEL MENU (envia el emoji)*'
        client.sendMessage(phone, list).then((response) => {
            if (response.id.fromMe) {
                console.log("text fue enviado!");
            }
        })
    } else {
        client.sendMessage(phone, 'No se encuentra registrado como chofer, consulte con el administrador').then((response) => {
            if (response.id.fromMe) {
                console.log("text fue enviado!");
            }
        })
    }
    return true;
  };

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
    var list = '*Hola*, '+micliente.data.nombre+' soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente de ventas.\n'
    list += '*COMO TE PUEDO AYUDAR ?* \n'
    list += '----------------------------------'+' \n'
    list += '*A* .- TODOS LOS NEGOCIOS \n'
    list += '*B* .- TODOS LOS PRODUCTOS \n'
    list += '*C* .- BUSCAR UN PRODUCTO \n'
    list += '*D* .- VER MI CARRITO \n'
    list += '*E* .- VER MI PERFIL \n'
    list += '----------------------------------'+' \n'
    list += '*F* .- SOY CHOFER \n'
    list += '----------------------------------'+' \n'
    list += '*M* .- MI NEGOCIO \n'
    list += '----------------------------------'+' \n'
    list += '*ENVIA UNA OPCION DEL MENU ejemplo: a o b ..*'
    client.sendMessage(phone, list).then((response) => {
        if (response.id.fromMe) {
            console.log("text fue enviado!");
        }
    })
    return true
  }

  const menu_negocio = async (minegocio, phone) => {
    // console.log(minegocio.data)
    var miestado = (minegocio.data.estado === '1') ? 'Abierto' : 'Cerrado'
    var list = '*Hola*, '+minegocio.data.contacto+' soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente de ventas.\n'
    list += '*ID :* '+minegocio.data.id+'\n'
    list += '*Mi Negocio :* '+minegocio.data.nombre+'\n'
    list += '*Direccion :* '+minegocio.data.direccion+'\n'
    list += '*Estado :* '+miestado+'\n'
    // list += '*ID :* '+minegocio.data.id+'\n'
    list += '----------------------------------\n'
    list += '*🔄* .- Cambiar de Estado (Abierto/Cerrrado)\n'
    // list += '*📍* .- Cambiar de Ubicacion (mapa)\n'
    list += '----------------------------------\n'
    list += '*Tienda en Linea*\n'
    list += process.env.APP_URL+minegocio.data.slug
    client.sendMessage(phone, list).then((response) => {
        if (response.id.fromMe) {
            console.log("text fue enviado!");
        }
    })
    const mimapa = new Location(parseFloat(minegocio.data.latitud), parseFloat(minegocio.data.longitud), minegocio.data.direccion);
    client.sendMessage(phone, mimapa)
    return true
  }

  client.initialize();
