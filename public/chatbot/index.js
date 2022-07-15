const express = require('express');
const axios = require('axios');
const qrcode = require("qrcode-terminal");
const cors = require('cors')
const { Client, MessageMedia, LocalAuth, Location, Buttons} = require("whatsapp-web.js");

// const { io } = require("socket.io-client");
// const socket = io("https://socket.appxi.net");

const JSONdb = require('simple-json-db');
// const { json } = require('express');
const categorias = new JSONdb('json/categorias.json');
const negocios = new JSONdb('json/negocios.json');
const productos = new JSONdb('json/productos.json');
const carts = new JSONdb('json/carts.json');
const pasarelas = new JSONdb('json/pasarelas.json');
const locations = new JSONdb('json/locations.json');
const localidades = new JSONdb('json/localidades.json');
const bussiness = new JSONdb('json/bussiness.json');

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
    console.log('Nuevo QR, recuerde que se genera cada 1 minuto.')
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
    if (micliente.data.nombre) {
        if (micliente.data.poblacion_id) {
            if (msg.type === 'chat') {
                switch (true) {
                    case (msg.body === 'hola') || (msg.body === 'HOLA') || (msg.body === 'Hola') || (msg.body === 'Buenas')|| (msg.body === 'buenas') || (msg.body === 'BUENAS') || (msg.body === '0'):
                        menu_principal(micliente, msg.from)
                        break;
                    case (msg.body === 'A') || (msg.body === 'a'):
                        var miresponse = await axios(process.env.APP_URL+'api/negocios/'+micliente.data.poblacion_id)
                        var list = '*🏚️ NEGOCIOS DISPONIBLES 🏚️* \n'
                        list += micliente.data.localidad.nombre+'\n'
                        list += '----------------------------------'+' \n'
                        for (let index = 0; index < miresponse.data.length; index++) {
                            list += '*A'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' - ('+miresponse.data[index].productos.length+')\n'
                            negocios.set('A'+miresponse.data[index].id, miresponse.data[index].id);
                        }
                        list += '----------------------------------\n'
                        list += '*ENVIA UNA OPCION DEL MENU ejemplo: a1 o a2..*'+'\n'
                        list += '----------------------------------\n'
                        list += 'Catalogo Completo\n'
                        list += process.env.APP_URL+'markplace'
                        client.sendMessage(msg.from, list)
                        break;
                    case negocios.has(msg.body.toUpperCase()):
                        var miresponse = await axios(process.env.APP_URL+'api/filtros/'+negocios.get(msg.body.toUpperCase()))
                        //Validación de que solo visualice los de su localidad
                        if (micliente.data.poblacion_id== miresponse.data[0].negocio.poblacion_id) {
                            var minegocio = miresponse.data[0].negocio
                            var miestado = (miresponse.data[0].negocio.estado == 1) ? 'Abierto' : 'Cerrado'
                            var list = '*'+minegocio.nombre.toUpperCase()+'*\n'
                            list += '----------------------------------'+'\n'
                            list += '*Estado :* '+miestado+'\n'
                            list += '*Horario :* '+minegocio.horario+'\n'
                            list += '*Direccion :* '+minegocio.direccion+'\n'
                            list += '----------------------------------'+'\n'
                            list += '*MENU DEL DIA*\n'
                            for (let index = 0; index < miresponse.data.length; index++) {
                                list += '*B'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' - *('+miresponse.data[index].precio+' Bs.)*\n'
                                productos.set('B'+miresponse.data[index].id, miresponse.data[index].id)
                            }       
                            list += '*ENVIA UNA OPCION* ejemplo: B'+miresponse.data[0].id+' o B'+miresponse.data[1].id+'\n'
                            list += '----------------------------------'+'\n'                                
                            list += '*Tienda el Linea*\n'
                            list += process.env.APP_URL+'negocio/'+minegocio.slug+'\n'
                            list += '----------------------------------'+'\n'   
                            list += '*Mas Opciones:*\n'
                            list += '*📞 :* Llamar\n'
                            list += '*🚩 :* Mapa\n' 
                            list += '*Envia un emoji*\n'
                            var mimedia = minegocio.logo ? MessageMedia.fromFilePath('../../storage/app/public/'+minegocio.logo) : MessageMedia.fromFilePath('imgs/mitienda.png');
                            bussiness.set(msg.from, minegocio.chatbot_id)
                            client.sendMessage(msg.from, mimedia, {caption: list})
                        }
                        else{
                            client.sendMessage(msg.from, '📍 El negocio solicitado no se encuentra en tu Localidad 📍')
                        }                       
                        break;
                    case (msg.body === '📞'):                        
                        client.sendMessage(msg.from, await client.getContactById(bussiness.get(msg.from)))
                        break;
                    case (msg.body === '🚩'):
                        var minegocio = await axios(process.env.APP_URL+'api/minegocio/'+bussiness.get(msg.from))
                        var mimapa = new Location(parseFloat(minegocio.data.latitud), parseFloat(minegocio.data.longitud), minegocio.data.direccion)
                        client.sendMessage(msg.from, mimapa)
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
                        client.sendMessage(msg.from, list)
                        break;
                    case productos.has(msg.body.toUpperCase()):
                            var miresponse = await axios(process.env.APP_URL+'api/producto/'+productos.get(msg.body.toUpperCase()))
                            if (miresponse.data) {
                                if (miresponse.data.negocio.poblacion_id==micliente.data.poblacion_id) {
                                    let media = ''
                                    if (miresponse.data.image) {
                                        media = MessageMedia.fromFilePath('../../storage/app/public/'+miresponse.data.image)
                                    } else {
                                        media = MessageMedia.fromFilePath('imgs/default.png')
                                    }
                                    var categoria = miresponse.data.categoria ? miresponse.data.categoria.nombre : 'categoria no registrada'
                                    var list = '*CODIGO* B'+miresponse.data.id+'\n'
                                    list += '*NOMBRE* .- '+miresponse.data.nombre+'\n'
                                    list += '*DETALLE* .- '+miresponse.data.detalle+'\n'
                                    list += '*PRECIO* .- '+miresponse.data.precio+' Bs.\n'
                                    list += '--------------------------'+'\n'
                                    list += '*A'+miresponse.data.negocio.id+'* .- '+miresponse.data.negocio.nombre.toUpperCase()+'\n'
                                    list += '--------------------------'+'\n'
                                    list += '*Y* .- AÑADIR A CARRITO\n'                                
                                    list += '*0* .- VOLVER A MENU PRINCIPAL\n'
                                    list += '--------------------------'+'\n'
                                    if (miresponse.data.negocio.chatbot_id === msg.from) {
                                        list += '*🔂* .- Dar de Baja (solo dueño del negocio)\n'
                                        list += '--------------------------'+'\n'
                                    }
                                    list += '*ENVIA UNA OPCION ejemplo: y*'
                                    client.sendMessage(msg.from, media, {caption: list})
                                    carts.set(msg.from, miresponse.data.id)
                                }
                                else{
                                    client.sendMessage(msg.from, 'El producto mencionado no se encuentra en su localidad')
                                }    
                            } else {
                                client.sendMessage(msg.from, '❌ El producto ahora NO esta disponible ❌')
                            }           
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
                        var miresponse = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', {chatbot_id: msg.from})
                        var micant = await axios(process.env.APP_URL+'api/pedido/carrito/negocios/'+msg.from)
                        if (miresponse.data.length != 0) {
                            var list = '🛒*Lista de productos en tu carrito*🛒 \n'
                            var total = 0
                            list += '------------------------------------------\n'
                            for (let index = 0; index < miresponse.data.length; index++) {
                                list += '*CODIGO* .- B'+miresponse.data[index].producto_id+'\n'
                                list += '*NOMBRE* .- '+miresponse.data[index].producto.nombre+'\n'
                                list += '*DETALLE* .- '+miresponse.data[index].producto.detalle+'\n'
                                list += '*PRECIO* .- '+miresponse.data[index].producto.precio+' Bs.\n'
                                list += '*CANTIDAD* .- '+miresponse.data[index].cantidad+'\n'
                                list += '*NEGOCIO* .- '+miresponse.data[index].negocio_name.toUpperCase()+'\n'
                                list += '------------------------------------------ \n'
                                total += miresponse.data[index].producto.precio * miresponse.data[index].cantidad
                            }
                            list += '*PRODUCTOS* .- '+total+' Bs. \n'
                            list += '*DELIVERY* .- '+(micant.data * parseFloat(micliente.data.localidad.tarifa))+' Bs.\n'
                            list += '*TOTAL* .- '+(total + (micant.data * parseFloat(micliente.data.localidad.tarifa)))+' Bs.\n'
                            list += '------------------------------------------\n'
                            list += '*G* .- REALIZAR PEDIDO\n'
                            list += '*H* .- VACIAR CARRITO \n'
                            list += '*0* .- MENU PRINCIPAL \n'
                            list += '------------------------------------------\n'
                            list += 'Tiempo aproximado de entrega: '+process.env.TIME+'\n'
                            list += '------------------------------------------\n'
                            list += '*ENVIA UNA OPCION ejemplo: g o h ..*'
                            client.sendMessage(msg.from, list)
                        } else {
                            client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL')
                        }
                        break;
                    case pasarelas.has(msg.body.toUpperCase()): // FIN DEL FLUJO
                        var miresponse = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', {chatbot_id: msg.from})
                        
                        if (miresponse.data.length != 0 && micliente.data.ubicaciones.length != 0){
                            //registro del pedido--------
                            var midata = {
                                chatbot_id: msg.from,
                                pago_id: msg.body.substring(1, 99),
                                cliente_id: micliente.data.id,
                                ubicacion_id: locations.get(msg.from)
                            }
                            var newpedido = await axios.post(process.env.APP_URL+'api/pedido/save', midata)

                            //Lógica para Agrupar Negocios--------------------------
                            var negocios3= await axios(process.env.APP_URL+'api/pedido/negocios/'+newpedido.data.id)
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

                            var midata2={
                                pedido_id: newpedido.data.id,
                                negocios: send_negocios.length,
                                total_delivery: send_negocios.length * parseFloat(micliente.data.localidad.tarifa)
                            }
                            await axios.post(process.env.APP_URL+'api/update/pedido/delivery', midata2)

                            //BANYPAY--------------------------------                                      
                            // var micart = []
                            // for (let index = 0; index < newpedido.data.productos.length; index++) {
                            //     micart.push({"concept": newpedido.data.productos[index].producto_name, "quantity": newpedido.data.productos[index].cantidad, "unitPrice": newpedido.data.productos[index].precio})
                            // }
                            // micart.push({"concept": "Servicio de Delivery", "quantity": parseInt(send_negocios.length), "unitPrice": send_negocios.length * parseFloat(micliente.data.localidad.tarifa)})

                            // var miconfig = {
                            //         "affiliateCode": process.env.BANIPAY_CODE,
                            //         "notificationUrl": "#",
                            //         "withInvoice": false,
                            //         "externalCode": newpedido.data.id,
                            //         "paymentDescription": "Pago por servicios de Transporte (GoDelivery)",
                            //         "details": micart,
                            //         "postalCode": "Bolivianos"
                            //       }
                            // var banipay = await axios.post('https://banipay.me:8443/api/payments/transaction', miconfig)
                            // await axios.post(process.env.APP_URL+"api/banipay/save", {paymentId: banipay.data.paymentId, transactionGenerated: banipay.data.transactionGenerated, externalCode: banipay.data.externalCode})

                            var mipedido = await axios(process.env.APP_URL+'api/pedido/'+newpedido.data.id)

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
                            //client.sendMessage(msg.from, media, {caption: 'qr_de_pago'}); 

                            //Responder al cliente por su compra-------------------------
                            var list = '🕦 *Pedido #'+mipedido.data.id+' Enviado* 🕦 \n Se te notificará el proceso de tu pedido, por este mismo medio. \n 🎉 *GRACIAS POR TU PREFERENCIA* 🎉\n'
                            list += '------------------------------------------\n'
                            list += 'Instrucciones para Pagar con QR (Opcional): \n'
                            list += 'Paso 1.- Escanea el QR desde la App de tu Banco \n'
                            list += 'Paso 2.- Realiza la transacción\n'
                            list += 'Paso 3.- Envía: *CONFIR'+mipedido.data.id+'* (La palabra seguido del número de pedido indicado) para verificar el estado de la transacción\n'
                            // list += 'Link de Pago *(opcional)*\n'
                            // list += 'https://banipay.me/super/payment'+mipedido.data.banipay.urlTransaction+'\n'
                            // list += '------------------------------------------\n'
                            // list += 'Ingresa al link de pago si deseas pagar por internet *(100% seguro)*, para cualquier consulta o duda. puede llamar al administrador\n'
                            //var mediag = MessageMedia.fromFilePath('imgs/gracias.gif')
                            client.sendMessage(msg.from, media, {caption: list})

                            //Lógica para Agrupar y enviar Pedidos por Negocio----------------------
                            for (let index = 0; index < send_negocios.length; index++) {
                                var total_pedido_actual=0;
                                var mismg=''
                                mismg += 'Hola, *'+negocios3.data[index].negocio_name+'* tienes un pedido solicitado, con el siguiente detalle: \n'
                                mismg += '------------------------------------------\n'
                                mismg += '*Pedido #:* '+negocios3.data[index].pedido_id+'\n'
                                mismg += '*Cliente:* '+mipedido.data.cliente.nombre+'\n'
                                mismg += '*Fecha:* '+negocios3.data[index].published+'\n'
                                mismg += '------------------------------------------\n'
                                for (let j = 0; j < negocios3.data.length; j++) {
                                    if (send_negocios[index].id== negocios3.data[j].negocio.id) {
                                        total_pedido_actual+=negocios3.data[j].total
                                        mismg += '*Producto:* '+negocios3.data[j].producto_name+'\n'
                                        mismg += '*Cantidad:* '+negocios3.data[j].cantidad+'\n'
                                        mismg += '*Precio:* '+negocios3.data[j].precio+' Bs.\n'
                                        mismg += '*SubTotal:* '+negocios3.data[j].total+' Bs.\n'
                                        mismg += '------------------------------------------\n'
                                        var telef_negocio=negocios3.data[j].negocio.telefono
                                        var telef_negocio='591'+telef_negocio+'@c.us'
                                    }
                                }
                                mismg += '*Total:* '+total_pedido_actual+' Bs.\n'
                                mismg += '------------------------------------------\n'
                                mismg += 'La asignación a un Delivery está en proceso, ve realizando el pedido porfavor.'
                                client.sendMessage(telef_negocio, mismg)
                            }

                            //ENVIAR PEDIDOS A MENSAJEROS-------------------------
                            ubic_cliente=''
                            ubic_cliente +='Ubicación del Cliente: '+mipedido.data.cliente.nombre+' - '
                            ubic_cliente +=mipedido.data.ubicacion.detalles
                            const locationcliente = new Location(mipedido.data.ubicacion.latitud, mipedido.data.ubicacion.longitud, ubic_cliente);
                            var mensajeroslibre = await axios(process.env.APP_URL+'api/mensajeros/libre/'+micliente.data.poblacion_id)
                            for (let index = 0; index < mensajeroslibre.data.length; index++) {   
                                var total_mensajero = 0
                                var cantidad_mensajero = 0 
                                var mitext = '' 
                                mitext += 'Hola, *'+mensajeroslibre.data[index].nombre+'* hay un pedido disponible con el siguiente detalle:\n'                       
                                mitext += '------------------------------------------\n'
                                mitext += '*ID:* '+mipedido.data.id+'\n'
                                mitext += '*Cliente:* '+mipedido.data.cliente.nombre+'\n'
                                mitext += '*Fecha:* '+mipedido.data.published+'\n'
                                mitext += '----- *PRODUCTOS* -----\n'
                                for (let j = 0; j < mipedido.data.productos.length; j++) {
                                    mitext += '*NOMBRE:* '+mipedido.data.productos[j].producto_name+'\n'
                                    mitext += '*PRECIO:* '+mipedido.data.productos[j].precio+' Bs.\n'
                                    mitext += '*CANT:* '+mipedido.data.productos[j].cantidad+'\n'
                                    mitext += '*NEGOCIO:* '+mipedido.data.productos[j].negocio_name+'\n\n'
                                    total_mensajero += mipedido.data.productos[j].total 
                                    cantidad_mensajero += mipedido.data.productos[j].cantidad
                                }
                                mitext += '----- *TOTALES* -----\n'
                                mitext += '*Productos:* '+cantidad_mensajero+'\n'
                                mitext += '*Negocios:* '+send_negocios.length+'\n'
                                mitext += '*Delivery:* '+((send_negocios.length)*parseFloat(micliente.data.localidad.tarifa))+' Bs.\n'
                                mitext += '*Total:* '+(total_mensajero+((send_negocios.length)*parseFloat(micliente.data.localidad.tarifa)))+' Bs.'
                                client.sendMessage(mensajeroslibre.data[index].telefono, mitext)
                                
                                //enviando pedido a negocios------------------------------
                                for (let j = 0; j < send_negocios.length; j++) {
                                    var mitexto=''
                                    mitexto +='Ubicación del Negocio: '+send_negocios[j].nombre+' - '
                                    mitexto +=send_negocios[j].direccion
                                    client.sendMessage(mensajeroslibre.data[index].telefono, new Location(parseFloat(send_negocios[j].latitud), parseFloat(send_negocios[j].longitud), mitexto))
                                }
                                client.sendMessage(mensajeroslibre.data[index].telefono, locationcliente)
                                var mitext = '' 
                                mitext += '*QUIERES TOMAR EL PEDIDO #'+mipedido.data.id+' ?* \n'
                                mitext += 'Envia *='+mipedido.data.id+'* para confirmar.'
                                client.sendMessage(mensajeroslibre.data[index].telefono, mitext)
                            }
                            // var admin = await client.getContactById(process.env.CHATBOT)
                            // client.sendMessage(msg.from, admin)
                            }else {
                                client.sendMessage(msg.from, '❌ *Tu carrito esta vacio o no tienes un mapa registrado* ❌ \n *0* .- MENU PRINCIPAL')
                            }
                        break;
                    case (msg.body === 'G') || (msg.body === 'g'):
                        var micart = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', {chatbot_id: msg.from})
                        if (micart.data.length != 0)
                        {
                            var list = '🗺️ Genial, ahora necesitamos tu ubicacion, para enviar tu pedido 🗺️\nEnvia tu ubicacion actual (un mapa) por favor\n'
                            list += 'Si ya enviaste un mapa anteriormente, puedes enviar *(p1 o p2)*'
                            client.sendMessage(msg.from, list)
                        } else {
                            client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL')
                        }
                        break;
                    case (msg.body === 'H') || (msg.body === 'h'):
                        await axios.post(process.env.APP_URL+'api/chatbot/cart/clean', {chatbot_id: msg.from})
                        client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL')
                        break;
                    case (msg.body === 'y') || (msg.body === 'Y'):
                        client.sendMessage(msg.from, 'Genial ✌, Ingresa una cantidad para agragar a tu carrito\ncon el formato: *+1 o +2 ..*')
                        break;
                    case (msg.body === 'm') || (msg.body === 'M'): //NEGOCIO
                        var minegocio = await axios(process.env.APP_URL+'api/minegocio/'+msg.from)
                        if (minegocio.data) {
                            menu_negocio(minegocio, msg.from)
                        } else {
                            client.sendMessage(msg.from, 'No tiene registrado un negocio con nosotros, contactese con el administrador')
                            var admin = await client.getContactById(process.env.CHATBOT)
                            client.sendMessage(msg.from, admin)
                        }                        
                        break;
                    case (msg.body.substring(0, 1) === '+'):           
                        var cant = msg.body.substring(1, 99)
                        var product_id = carts.get(msg.from)
                        var product = await axios(process.env.APP_URL+'api/producto/'+product_id)
                        var minegocio = await axios(process.env.APP_URL+'api/negocio/'+product.data.negocio.id)
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
                            var list = '*🎉 Producto agregado a tu carrito 🎉*\n'
                            list += 'Si deseas agregar mas productos a tu carrito visita el mismo u otros negocios (A).\n'
                            list += '------------------------------------------\n'
                            list += '*D* .- VER MI CARRITO\n'
                            list += '*G* .- SOLICITAR PEDIDO\n'
                            list += '*A* .- TODOS LOS NEGOCIOS\n'
                            list += '------------------------------------------\n'
                            list += '*ENVIA UNA OPCION ejemplo: d o g ..*'
                            client.sendMessage(msg.from, list)
                        } else {
                            client.sendMessage(msg.from, '❌ Lo lamento el negocio esta cerrado ❌')
                        }
                        break;
                    case (msg.body === 'E') || (msg.body === 'e') || (msg.body === 'Perfil') || (msg.body === 'perfil') || (msg.body === 'miperfil') || (msg.body === 'Miperfil') || (msg.body === 'Mi Perfil') || (msg.body === 'mi perfil'):
                        menu_cliente(msg.from)
                        break;
                    case (msg.body.substring(0, 1) === '#'):
                        var midescription = msg.body.substring(1, 99)
                        var milocation = locations.get(msg.from)
                        await axios.post(process.env.APP_URL+'api/ubicacion/update', {id: milocation, detalle: midescription})                        
                        var pagos = await axios(process.env.APP_URL+'api/chatbot/pasarelas/get')
                        var list = '*PUEDES PAGAR TU PEDIDO POR ESTOS METODOS*\n'
                        list += '------------------------------------------ \n'
                        for (let index = 0; index < pagos.data.length; index++) {
                            list += '*P'+pagos.data[index].id+'* .- '+pagos.data[index].title+'\n'
                            pasarelas.set('P'+pagos.data[index].id, pagos.data[index].id)
                        }
                        list += '------------------------------------------ \n'
                        list += 'Genial ✌ como quieres pagar tu pedido ? envia *p1 o p2* .. para confirmar tu pedido.'
                        client.sendMessage(msg.from, list)
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
                            var mitext='🎉Felicidades se te fue asignado el PEDIDO #'+midescription+'🎉\n'
                            mitext+= '------------------------------------------\n'
                            // mitext+= 'Pedido #'+midescription+' Asignado Correctamente\n'
                            mitext+= 'Porfavor, proceda a ir lo antes posible a recoger el pedido a los negocios respectivos\n'
                            mitext+= 'Una vez que tenga el pedido completo, envíe */'+midescription+'* para confirmar el estado.\n'
                            // mitext+= 'Luego envíe su *Ubicación en Tiempo Real* al Cliente porfavor\n'
                            mitext+= '------------------------------------------\n'
                            mitext+= 'Envíe: *?* seguido de una descripción para cancelar su servicio por algún motivo si es que fue antes de recoger el pedido.\n'
                            mitext+= 'Ejemplo: *?Se me pinchó la llanta*\n'
                            mitext+= 'Si ya recogió el pedido usted tiene total responsabilidad del mismo.\n'
                            mitext+= '------------------------------------------\n'
                            mitext+= 'Envíe tu *Ubicación en Tiempo Real* al cliente, para iniciar el viaje porfavor.'                                 
                            client.sendMessage(msg.from, mitext)

                            //notificacion al cliente
                            var pedido= await axios(process.env.APP_URL+'api/pedido/'+midescription)
                            var contacto_cliente= await client.getContactById(pedido.data.cliente.chatbot_id)
                            client.sendMessage(msg.from, contacto_cliente);
                            var mitext=''
                            mitext += 'Su pedido fue asignado al Delivery: '+pedido.data.mensajero.nombre+'\n'
                            mitext += 'Le avisaremos cuando el Delivery tenga su Pedido\n'
                            mitext += 'Una vez le llegue el pedido, envíe *%'+midescription+'* para confirmar porfavor.\n'
                            client.sendMessage(pedido.data.chatbot_id, mitext)
    
                            //notificacion a los negocios 
                            var send_negocios= await negocios_pedido(midescription)
                            for (let index = 0; index < send_negocios.length; index++) {
                                mitext= ''
                                mitext+= 'El Delivery: '+pedido.data.mensajero.nombre+' será el encargado de recoger el pedido #'+midescription+'\n'
                                var telefono_negocio= '591'+send_negocios[index].telefono+'@c.us'
                                client.sendMessage(telefono_negocio, mitext)                           
                            }
                        } else {
                            client.sendMessage(msg.from, 'El pedido #'+midescription+' ya está asignado a otro Delivery, intenta con otro pedido.')
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
                            client.sendMessage(msg.from, 'Pedido #'+pedido_cancelado.data.id+' cancelado esperamos que resuelva lo mas pronto posible sus inconvenientes.')
                            //Mensaje al Cliente de que su pedido fue cancelado
                            var mitext=''
                            mitext+= 'Su pedido #'+pedido_cancelado.data.id+' ha sido cancelado por el chofer '+pedido_cancelado.data.mensajero.nombre+'\n'
                            mitext+= 'El motivo fue el siguiente: '+midescription+'\n'
                            mitext+= 'Estamos buscando otro chofer para llevar su pedido, lamentamos los inconvenientes.'
                            client.sendMessage(pedido_cancelado.data.cliente.chatbot_id, mitext)
                            //Envío a los mensajeros que el pedido está libre nuevamente
                            var mensajeroslibre = await axios(process.env.APP_URL+'api/mensajeros/libre')
                            for (let index = 0; index < mensajeroslibre.data.length; index++) {
                                console.log(mensajeroslibre.data[index].telefono)
                                if(mensajeroslibre.data[index].telefono != msg.from){    
                                    var mitext = '' 
                                    mitext += 'Hola, '+mensajeroslibre.data[index].nombre+' el pedido #'+pedido_cancelado.data.id+' está disponible nuevamente,\n'
                                    mitext += 'si aun deseas tomar el pedido para llevarlo a su destino envía: *='+pedido_cancelado.data.id+'*\n'
                                    client.sendMessage(mensajeroslibre.data[index].telefono, mitext)
                                }
                            }                            
                        }
                        else{
                            client.sendMessage(msg.from, 'Usted no tiene un pedido asignado para cancelarlo')
                        }
                        break;
                    //Estado del Pedido Llevando
                    case (msg.body.substring(0, 1) === '/'):
                        var midescription = msg.body.substring(1, 99)
                        var pedido= await axios(process.env.APP_URL+'api/llevando/pedido/'+midescription)
                        var mitext = 'Hola *'+pedido.data.mensajero.nombre+'*\n'
                        mitext += 'recogiste el pedido y lo estás llevando hasta el cliente '+pedido.data.cliente.nombre+'\n'
                        mitext += 'Una vez sea entregado correctamente envíe *%'+pedido.data.id+'* para confirmar porfavor.\n'
                        client.sendMessage(msg.from, mitext)
                        mitext=''
                        mitext += 'Su pedido *#'+pedido.data.id+'* ya fue entregado a su Delivery asignado y está siendo llevado a su Domicilio.\n'
                        mitext += 'Porfavor, esté atento.\n'
                        mitext += 'Una vez le llegue el pedido envíe *%'+pedido.data.id+'* para confirmar porfavor.'
                        client.sendMessage(pedido.data.chatbot_id, mitext)
                        break;
                    //Estado del Pedido Entregado
                    case (msg.body.substring(0, 1) === '%'):
                        var midescription = msg.body.substring(1, 99)
                        var pedido= await axios(process.env.APP_URL+'api/entregando/pedido/'+midescription)
    
                        var mitext=''
                        mitext += 'Hola, *'+pedido.data.mensajero.nombre+'*\n'
                        mitext += 'El pedido #'+midescription+' fue entregado al cliente '+pedido.data.cliente.nombre+' correctamente\n'
                        mitext += 'Estás libre y habilitado para realizar mas Deliverys.\n'
                        client.sendMessage(pedido.data.mensajero.telefono, mitext)
                        menu_mensajero(pedido.data.mensajero.telefono)
                        
                        //notificacion al cliente
                        mitext=''
                        mitext += 'Su pedido ya fue entregado a su persona en su Domicilio.\n'
                        mitext += 'Esperamos que el servicio haya sido de su agrado.\n'
                        mitext += 'Que tenga Buen provecho le desea Go Delivery.\n'
                        mitext += '------------------------------------------ \n'
                        mitext += 'Si tienes alguna queja o sugerencia puedes enviarla de la siguiente forma:\n'
                        mitext += '*Ejemplo 1:* &Mi pedido llegó...\n'
                        mitext += '*Ejemplo 2:* &Quisiera que adicionen a su servicio...'
                        client.sendMessage(pedido.data.chatbot_id, mitext)
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
                            mitext+= 'Su comentario: *'+midescription+'* respecto a su pedido *#'+pedido_comentario.data.id+'*\n'
                            mitext+= 'fue registrado exitosamente y se le dará respuesta lo mas pronto posible.\n'
                            mitext+= 'Gracias por utilizar *GoDelivery*'
                            client.sendMessage(msg.from, mitext)

                        } else {
                            var mitext=''
                            mitext+= 'Hola, de momento no tienes pedidos registrados, puedes realizar uno cuando gustes.\n'
                            mitext+= 'Envía: Hola para ver el Menú Principal\n'
                            client.sendMessage(msg.from, mitext)
                            menu_principal(micliente, msg.from)
                        }
                        break;
                    case (msg.body === 'f') || (msg.body === 'F'):
                        menu_mensajero(msg.from)
                        break;
                    case (msg.body === '🔃'):
                        await axios(process.env.APP_URL+'api/mensajero/update/'+msg.from)
                        client.sendMessage(msg.from, 'Estado Cambiado')
                        menu_mensajero(msg.from)
                        break;
                    case (msg.body === 'ℹ️'):
                        // var minegocio = await axios(process.env.APP_URL+'api/minegocio/'+msg.from)
                        client.sendMessage(msg.from, '🚚 Somos un servicio de mensajaeria(delivery) todo por whatsapp y con un asistente virtual 🤖CHATBOT🤖, donde podras realizar tus compras a los 🍴 negocios🍴 de tu preferiencia, para mas informacion visita nuestra pagina web. 🚚\n'+process.env.APP_URL+'nosotros')
                        // menu_negocio(minegocio, msg.from)
                        break;
                    case (msg.body === '🔄'):
                        var minegocio = await axios(process.env.APP_URL+'api/negocio/update/'+msg.from)
                        client.sendMessage(msg.from, 'Estado Cambiado')
                        menu_negocio(minegocio, msg.from)
                        break;
                    case (msg.body === '📍'):
                        var mispoblaciones = await axios(process.env.APP_URL+'api/poblaciones')
                        var list = '*A que localidad te cambiar ?*\n'
                        list += '----------------------------------'+'\n'
                        for (let index = 0; index < mispoblaciones.data.length; index++) {
                            list +=  '*Z'+mispoblaciones.data[index].id+'* .- '+mispoblaciones.data[index].nombre+'\n'
                        }
                        list += '----------------------------------\n'
                        list += '*Envia un opcion ejemplo: z1 o z2 ..*'
                        client.sendMessage(msg.from, list)
                        await axios.post(process.env.APP_URL+'api/chatbot/cart/clean', {chatbot_id: msg.from})
                        break;
                    case (msg.body === '🔂'):
                            await axios.post(process.env.APP_URL+'api/producto/update/admin', {phone: msg.from, producto_id: carts.get(msg.from)})
                            client.sendMessage(msg.from, '🛒 Producto Actualizado !')
                            break;
                    case (localidades.has(msg.body.toUpperCase())):
                        await axios.post(process.env.APP_URL+'api/cliente/update/localidad', {id: micliente.data.id, poblacion_id: localidades.get(msg.body.toUpperCase())})
                        client.sendMessage(msg.from, 'Estado Cambiado')
                        menu_cliente(msg.from)
                        break;
                    case (msg.body.substring(0, 6) === 'Confir') || (msg.body.substring(0, 6) === 'confir') || (msg.body.substring(0, 6) === 'CONFIR'):
                        var midescription = msg.body.substring(6, 99)
                        //console.log(msg.body.length)
                        var mipedido = await axios(process.env.APP_URL+'api/pedido/'+midescription)
                        var transaccion= await axios("https://modal-flask-dev-q5zse.ondigitalocean.app/consultQR?id="+mipedido.data.banipaydos.externalId)
                        if (transaccion.data.status=="EN COLA") {
                            //client.sendMessage(msg.from, 'Transacción de la Venta #'+midescription+' aún *NO Realizada*')
                            client.sendMessage(msg.from, 'Transacción de la Venta #'+midescription+' realizada exitosamente')
                            var send_negocios= await negocios_pedido(midescription)
                            //console.log(send_negocios)
                            for (let index = 0; index < send_negocios.length; index++) {
                                mitext= ''
                                mitext+= 'El Pedido #'+midescription+' del Cliente '+mipedido.data.cliente.nombre+'  fue pagado exitosamente por transferencia \n'
                                var telefono_negocio= '591'+send_negocios[index].telefono+'@c.us'
                                client.sendMessage(telefono_negocio, mitext)                           
                            }
                            client.sendMessage(mipedido.data.mensajero.telefono, 'El Pedido #'+midescription+' del Cliente '+mipedido.data.cliente.nombre+'  fue pagado exitosamente por transferencia')

                        } else {
                            //client.sendMessage(msg.from, 'Transacción de la Venta #'+midescription+' realizada exitosamente')
                            client.sendMessage(msg.from, 'Transacción de la Venta #'+midescription+' aún *NO Realizada*')

                        }
                        break;
                    case (msg.body === 'test'):
                        var bp_array={
                            "paymentId": 3,
                            "gloss": "Mi pago",
                            "amount": 10.00,
                            "currency": "BOB",
                            "singleUse": "true",
                            "expiration": "1/00:05",
                            "affiliate": "02e4b31f-20bd-43f9-9f2d-3ef7733f2d0f",
                            "business": "02e4b31f-20bd-43f9-9f2d-3ef7733f2d0f",
                            "code": "abc-012",
                            "type": "Banipay",
                            "idCommercial": "BC-0001"
                        }
                        var banipay = await axios.post("https://v2.banipay.me/api/pagos/qr-payment", bp_array)
                        console.log(banipay.data)
                        
                            //const media = await banipay.data.image.downloadMedia();
                            // do something with the media data here
                            const media = new MessageMedia('image/png', banipay.data.image);
                            client.sendMessage(msg.from, media, {caption: 'qr_de_pago'});                        
                            // client.sendMessage(msg.from, list).then((response) => {
                        //     if (response.id.fromMe) {
                        //         console.log("text fue enviado!");
                        //     }
                        // })
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
    
                    client.sendMessage(msg.from, 'Gracias, Para poder llegar mas rapido tu ubicacion (mapa), envia una descripcion de tu locacion, ejemplo: *#lado del tanque elevado, Condominio x Dep. y*\npor delante el simbolo *#*')
                } else {
                    client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL')
                }
            }else if(msg.type === 'call_log'){
                client.sendMessage(process.env.CHATBOT, 'Tienes una llamada perdida del #'+msg.from).then((response) => {
                    if (response.id.fromMe) {
                        console.log("text fue enviado!");
                    }
                })
            }
        } else {
            if (localidades.has(msg.body.toUpperCase())) {
                var clientel = await axios.post(process.env.APP_URL+'api/cliente/update/localidad', {id: micliente.data.id, poblacion_id: localidades.get(msg.body.toUpperCase())})
                menu_principal(clientel, msg.from)
            } else {
                var mispoblaciones = await axios(process.env.APP_URL+'api/poblaciones')
                var list = '*En que localidad te encuentras ?*\n'
                list += '----------------------------------'+'\n'
                for (let index = 0; index < mispoblaciones.data.length; index++) {
                    list +=  '*Z'+mispoblaciones.data[index].id+'* .- '+mispoblaciones.data[index].nombre+'\n'
                    // localidades.set('Z'+mispoblaciones.data[index].id, mispoblaciones.data[index].id)
                }
                list += '----------------------------------\n'
                list += '*Envia un opcion ejemplo: z1 o z2 ..*'
                client.sendMessage(msg.from, list)
            }
        }
    }else{
        // console.log(msg.body.length)
        if (msg.body.length >= 8) {
            var micliente = await axios.post(process.env.APP_URL+'api/cliente/update/nombre', {id: micliente.data.id, nombre: msg.body})
            var mispoblaciones = await axios(process.env.APP_URL+'api/poblaciones')
            var list = '*En que localidad te encuentras ?*\n'
            list += '----------------------------------'+'\n'
            for (let index = 0; index < mispoblaciones.data.length; index++) {
                list +=  '*Z'+mispoblaciones.data[index].id+'* .- '+mispoblaciones.data[index].nombre+'\n'
                // localidades.set('Z'+mispoblaciones.data[index].id, mispoblaciones.data[index].id)
            }
            list += '----------------------------------\n'
            list += '*Envia un opcion ejemplo: z1 o z2 ..*'
            client.sendMessage(msg.from, list)
        } else {
            var list = '*Bienvenido*, soy el 🤖CHATBOT🤖 DE : '+process.env.APP_NAME+'\n'
            list += '*🙋‍♀️Cual es tu Nombre Completo ?🙋‍♂️* \n'
            list += '*8 caracteres minimo* \n'
            client.sendMessage(msg.from, list)
        }
    }
})


app.get('/', async (req, res) => {
    res.send('CHATBOT');
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

const menu_mensajero = async (phone) => {
    var michofer200 = await axios(process.env.APP_URL+'api/mensajero/'+phone)
    if (michofer200.data) {
        var miestado = michofer200.data.estado ? 'Libre' : 'Ocupado'
        var list = '*Hola*, '+michofer200.data.nombre+' soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente.\n'
        list += '----------------------------------'+' \n'
        list += '*ID :* '+michofer200.data.id+'\n'
        list += '*Estado :* '+miestado+'\n'
        list += '*Nombres :* '+michofer200.data.nombre+'\n'
        list += '*Localidad :* '+michofer200.data.localidad.nombre+'\n'
        list += '*Whatsapp :* '+michofer200.data.telefono+'\n'
        list += '*Registrado :* '+michofer200.data.published+'\n'
        list += '*Deliverys :* '+michofer200.data.pedidos.length+'\n'
        list += '----------------------------------'+' \n'
        list += '*🔃* .- Cambiar de Estado (envia el emoji - Libre/Ocupado)\n'
        list += '----------------------------------'+' \n'
        list += '*Historial de Viajes Realizados*\n'
        list += process.env.APP_URL+'mensajero/'+phone
        client.sendMessage(phone, list)
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
    var list = '*Hola*, '+micliente.data.nombre+' soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente de ventas, visitas los negocios, llena tu carrito y reliza tu pedido.\n'
    list += '*OPCIONES* \n'
    list += '----------------------------------'+' \n'
    list += '*A* .- TODOS LOS NEGOCIOS \n'
    list += '*B* .- TODOS LOS PRODUCTOS \n'
    list += '*C* .- BUSCAR UN PRODUCTO \n'
    list += '----------------------------------'+' \n'
    list += '*D* .- VER MI CARRITO \n'
    list += '*E* .- VER MI PERFIL \n'
    list += '----------------------------------'+' \n'
    list += '*F* .- SOY CHOFER \n'
    list += '----------------------------------'+' \n'
    list += '*M* .- MI NEGOCIO \n'
    list += '----------------------------------'+' \n'
    list += '*ℹ️* .- SOBRE NOSOTROS \n'
    list += process.env.APP_URL+'/youtube\n'
    list += process.env.APP_URL+'ayuda \n'
    list += '----------------------------------'+' \n'
    list += '*ENVIA UNA OPCION ejemplo: a o b ..*'
    client.sendMessage(phone, list)
    return true
}

const menu_negocio = async (minegocio, phone) => {
    var miestado = (minegocio.data.estado === '1') ? 'Abierto' : 'Cerrado'
    var list = '*Hola*, '+minegocio.data.contacto+' soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* tu asistente de ventas.\n'
    list += '----------------------------------'+' \n'
    list += '*ID :* '+minegocio.data.id+'\n'
    list += '*Mi Negocio :* '+minegocio.data.nombre+'\n'
    list += '*Chatbot :* '+minegocio.data.chatbot_id+'\n'
    list += '*Localidad :* '+minegocio.data.poblacion.nombre+'\n'
    list += '*Direccion :* '+minegocio.data.direccion+'\n'
    list += '*Registrado :* '+minegocio.data.published+'\n'
    list += '*Productos :* '+minegocio.data.productos.length+'\n'
    list += '*Contacto :* '+minegocio.data.contacto+'\n'
    list += '*Estado :* '+miestado+'\n'
    list += '----------------------------------\n'
    list += '*🔄* .- Cambiar de Estado (envia el emoji - Abierto/Cerrado)\n'
    list += '----------------------------------\n'
    list += '*Mi Tienda en Linea*\n'
    list += process.env.APP_URL+'negocio/'+minegocio.data.slug
    client.sendMessage(phone, list)
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
    list += process.env.APP_URL+'cliente/'+phone
    client.sendMessage(phone, list)
}
client.initialize();
