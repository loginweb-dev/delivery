const express = require('express');
const axios = require('axios');
const qrcode = require("qrcode-terminal");
const cors = require('cors')
const { Client, MessageMedia, LocalAuth, Location} = require("whatsapp-web.js");

const { io } = require("socket.io-client");
const socket = io("https://socket.appxi.net");

const JSONdb = require('simple-json-db');
const categorias = new JSONdb('json/categorias.json');
const negocios = new JSONdb('json/negocios.json');
const productos = new JSONdb('json/productos.json');
const cupones = new JSONdb('json/cupones.json');
const carts = new JSONdb('json/carts.json');
const pasarelas = new JSONdb('json/pasarelas.json');
const sucursales = new JSONdb('json/sucursales.json');
const locations = new JSONdb('json/locations.json');

require('dotenv').config({ path: '../../.env' })

const app = express();
app.use(cors())
app.use(express.json())


const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "client-one"
    }),
    puppeteer: {
        ignoreDefaultArgs: ['--disable-extensions'],
        args: ['--no-sandbox']
    }
});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Nuevo QR, recuerde que se genera cada 1/2 minuto.')
});

client.on('ready', () => {
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
    // console.log('MESSAGE RECEIVED', msg);
    console.log(msg.type)
    var midata = {
        phone: msg.from,
        message: msg.body
    }
    // await axios.post(process.env.APP_URL+'api/chatbot/save', midata)
    // socket.emit("chatbot", msg.from)
    switch (true) {
        case (msg.body === 'hola') || (msg.body === 'HOLA') || (msg.body === 'Hola') || (msg.body === 'Buenas')|| (msg.body === 'buenas') || (msg.body === 'BUENAS') || (msg.body === '0'):
            var list = '*Hola*, soy el 🤖CHATBOT🤖 de: *'+process.env.APP_NAME+'* \n'
            list += '*MENU PRINCIPAL* \n'
            list += '----------------------------------'+' \n'
            list += '*A* .- TODOS LOS NEGOCIOS \n'
            list += '*B* .- TODOS LOS PRODUCTOS \n'
            // list += '*C* .- CUPONES \n'
            // list += '*D* .- SUCURSALES \n'
            list += '*E* .- BUSCAR UN PRODUCTO \n'
            list += '*F* .- VER MI CARRITO \n'
            list += '----------------------------------'+' \n'
            list += '*ENVIA UNA OPCION DEL MENU ejemplo: a o b ..*'
            client.sendMessage(msg.from, list).then((response) => {
                if (response.id.fromMe) {
                    console.log("text fue enviado!");
                }
            })
            var midata = {
                phone: msg.from,
                message: list
            }
            // await axios.post(process.env.APP_URL+'api/chatbot/save/out', midata)
            // socket.emit("chatbot", msg.from)
            break;
        case (msg.body === 'A') || (msg.body === 'a'):
            var miresponse = await axios(process.env.APP_URL+'api/negocios')
            var list = '*NEGOCIOS* \n'
            list += '----------------------------------'+' \n'
            for (let index = 0; index < miresponse.data.length; index++) {
                list += '*A'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' - ('+miresponse.data[index].productos.length+')\n'
                negocios.set('A'+miresponse.data[index].id, miresponse.data[index].id);
            }
            list += '----------------------------------'+' \n'
            list += '*ENVIA UNA OPCION DEL MENU*'
            client.sendMessage(msg.from, list).then((response) => {
                if (response.id.fromMe) {
                    console.log("text fue enviado!");
                }
            })
            // var midata = {
            //     phone: msg.from,
            //     message: list
            // }
            // await axios.post(process.env.APP_URL+'api/chatbot/save/out', midata)
            // socket.emit("chatbot", msg.from)
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
            // list += '----------------------------------'+'\n'
            for (let index = 0; index < miresponse.data.length; index++) {
                list += '*B'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+' - *('+miresponse.data[index].precio+' Bs.)*\n'
            }
            list += '----------------------------------'+'\n'        
            list += '*ENVIA UNA OPCION ejemplo: b1 o b2 ..*\n'
            var mimedia = MessageMedia.fromFilePath('../../storage/app/public/'+minegocio.logo)
            client.sendMessage(msg.from, mimedia, {caption: list}).then((response) => {
                if (response.id.fromMe) {
                    console.log("image fue enviado!");
                }
            })
            // var milocation = new Location(parseFloat(minegocio.latitud), parseFloat(minegocio.longitud), 'Direccion: '+minegocio.direccion)
            // client.sendMessage(msg.from, milocation).then((response) => {
            //     if (response.id.fromMe) {
            //         console.log("mapa fue enviado!");
            //     }
            // })
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
            list += '*ENVIA UNA OPCION DEL MENU*'
            client.sendMessage(msg.from, list).then((response) => {
                if (response.id.fromMe) {
                    console.log("text fue enviado!");
                }
            })
            // var midata = {
            //     phone: msg.from,
            //     message: list
            // }
            // await axios.post(process.env.APP_URL+'api/chatbot/save/out', midata)
            // socket.emit("chatbot", msg.from)
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
        // case (msg.body === 'C') || (msg.body === 'c'):
        //     var miresponse = await axios(process.env.APP_URL+'api/pos/cupones')
        //     var list = '*TODOS LOS CUPONES* \n'
        //     list += '------------------------------------'+'\n'
        //     for (let index = 0; index < miresponse.data.length; index++) {
        //         list += '*C'+miresponse.data[index].id+'* .- '+miresponse.data[index].title+'\n'
        //         cupones.set('C'+miresponse.data[index].id, miresponse.data[index].id)
        //     }
        //     list += '------------------------------------'+'\n'
        //     list += '*ENVIA UNA OPCION DEL MENU*'
        //     client.sendMessage(msg.from, list).then((response) => {
        //         if (response.id.fromMe) {
        //             console.log("text fue enviado!");
        //         }
        //     })
        //     var midata = {
        //         phone: msg.from,
        //         message: list
        //     }
        //     await axios.post(process.env.APP_URL+'api/chatbot/save/out', midata)
        //     socket.emit("chatbot", msg.from)
        //     break;
        // case (msg.body === 'D') || (msg.body === 'd'):
        //         var miresponse = await axios(process.env.APP_URL+'api/pos/sucursales')
        //         var list = '*TODAS NUESTRAS SUCURSALES*\n'
        //         list += '------------------------------------'+'\n'
        //         for (let index = 0; index < miresponse.data.length; index++) {
        //             list += '*D'+miresponse.data[index].id+'* .- '+miresponse.data[index].nombre+'\n'
        //             sucursales.set('D'+miresponse.data[index].id, miresponse.data[index].id)
        //         }
        //         list += '------------------------------------'+'\n'
        //         list += '*ENVIA UNA OPCION DEL MENU*'
        //         client.sendMessage(msg.from, list).then((response) => {
        //             if (response.id.fromMe) {
        //                 console.log("text fue enviado!");
        //             }
        //         })
        //         var midata = {
        //             phone: msg.from,
        //             message: list
        //         }
        //         await axios.post(process.env.APP_URL+'api/chatbot/save/out', midata)
        //         socket.emit("chatbot", msg.from)
        //         break;
        case (msg.body === 'E') || (msg.body === 'e'):
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
        case (msg.body === 'F') || (msg.body === 'f'):
            var midata = {
                chatbot_id: msg.from
            }
            var miresponse = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', midata)
            var micant = await axios(process.env.APP_URL+'api/carrito/negocios/'+msg.from)
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
                list += '*TOTALES*\n'
                list += '*PRODUCTOS* .- '+total+' Bs. \n'
                list += '*DELIVERY* .- '+(micant.data * 4)+' Bs. \n'
                list += '*TOTAL* .- '+(total + (micant.data * 4))+' Bs. \n'
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
        case pasarelas.has(msg.body.toUpperCase()):
            var midata = {
                chatbot_id: msg.from
            }
            var miresponse = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', midata)
            if (miresponse.data.length != 0) {
                var micliente = await axios(process.env.APP_URL+'api/cliente/'+msg.from)
                var pago_id = msg.body.substring(1, 99)
                var mediag = MessageMedia.fromFilePath('imgs/gracias.gif')
                var midata = {
                    chatbot_id: msg.from,
                    pago_id: pago_id,
                    cliente_id: micliente.data.id
                }
                var miventa = await axios.post(process.env.APP_URL+'api/chatbot/venta/save', midata)
                var list = '🕦 *Pedido #'+miventa.data.id+' Enviado* 🕦 \n Se te notificará el proceso de tu pedido, por este mismo medio. \n 🎉 *GRACIAS POR TU PREFERENCIA* 🎉'
                client.sendMessage(msg.from, mediag, {caption: list}).then((response) => {
                    if (response.id.fromMe) {
                        console.log("text fue enviado!");
                    }
                })

                }else {
                    client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL').then((response) => {
                        if (response.id.fromMe) {
                            console.log("text fue enviado!");
                        }
                    })
                }
            break;
        case (msg.body === 'G') || (msg.body === 'g'):
                
            client.sendMessage(msg.from, '🗺️ Genial, ahora necesitamos tu ubicacion(mapa), para enviar tu pedido\nEnvia tu ubicacion actual por favor. 🗺️').then((response) => {
                if (response.id.fromMe) {
                    console.log("text fue enviado!");
                }
            })

            // var midata = {
            //     chatbot_id: msg.from
            // }
            // var micart = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', midata)
            // if (micart.data.length != 0)
            // {
            //     var pagos = await axios(process.env.APP_URL+'api/chatbot/pasarelas/get')
            //     var list = '*PUEDES PAGAR POR ESTOS METODOS*\n'
            //     list += '------------------------------------------ \n'
            //     for (let index = 0; index < pagos.data.length; index++) {
            //         list += '*P'+pagos.data[index].id+'* .- '+pagos.data[index].title+'\n'
            //         pasarelas.set('P'+pagos.data[index].id, pagos.data[index].id)
            //     }
            //     list += '------------------------------------------ \n'
            //     list += 'Genial ✌ como quieres pagar tu pedido ? envia *c3 o c1* .. para confirmar tu pedido.'
            //     client.sendMessage(msg.from, list).then((response) => {
            //         if (response.id.fromMe) {
            //             console.log("text fue enviado!");
            //         }
            //     })
            // } else {
            //     client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL').then((response) => {
            //         if (response.id.fromMe) {
            //             console.log("text fue enviado!");
            //         }
            //     })
            // }
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
                list += '*F* .- VER MI CARRITO\n'
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
        case (msg.body === 'perfil') || (msg.body === 'miperfil') || (msg.body === 'Miperfil') || (msg.body === 'Mi Perfil') || (msg.body === 'mi perfil'):

            var miperfil = await axios(process.env.APP_URL+'api/cliente/'+msg.from)
            var list = '🎉 *MI PERFIL : *🎉\n'
            list += '------------------------------------------\n'
            list += '*ID* '+miperfil.data.id+'\n'
            list += '*Chat* '+miperfil.data.chatbot_id+'\n'
            list += '------------------------------------------\n'
            list += '*Mis Pedidos*\n'
            console.log(miperfil.data.pedidos.length)
            for (let index = 0; index < miperfil.data.pedidos.length; index++) {
                list += miperfil.data.pedidos[index].id+'\n'
            }
            list += '------------------------------------------\n'
            client.sendMessage(msg.from, list).then((response) => {
                if (response.id.fromMe) {
                    console.log("text fue enviado!");
                }
            })
            break;
        default:
                // var mediadefault = MessageMedia.fromFilePath('imgs/chatbot.png')
                // var list = '*Hola*, soy el 🤖CHATBOT🤖 DEL NEGOCIO : '+process.env.APP_NAME+' \n'
                // list += '*MENU PRINCIPAL* \n'
                // list += '------------------------------------------ \n'
                // list += '*A* .- NEGOCIOS \n'
                // list += '*B* .- PRODUCTOS \n'
                // list += '*E* .- BUSCAR UN PRODUCTO \n'
                // list += '*F* .- VER MI CARRITO \n \n'
                // list += '------------------------------------------ \n'
                // list += '*ENVIA UNA OPCION DEL MENU*'
                // client.sendMessage(msg.from, mediadefault, {caption: list}).then((response) => {
                //     if (response.id.fromMe) {
                //         console.log("text fue enviado!");
                //     }
                // })
            break;
    }

    //get location ---------------
    if (msg.type === 'location') {
        // console.log(msg)
        var micliente = await axios(process.env.APP_URL+'api/cliente/'+msg.from)
        var midata0 = {
            cliente_id: micliente.data.id,
            latitud: msg.location.latitude,
            longitud: msg.location.longitud
        }
        var miubicacion = await axios.post(process.env.APP_URL+'api/ubicacion/save', midata0)
        locations.set(msg.from, miubicacion.data.id)
        
        var midata = {
            chatbot_id: msg.from
        }
        var micart = await axios.post(process.env.APP_URL+'api/chatbot/cart/get', midata)
        if (micart.data.length != 0)
        {
            var pagos = await axios(process.env.APP_URL+'api/chatbot/pasarelas/get')
            var list = '*PUEDES PAGAR POR ESTOS METODOS*\n'
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


        } else {
            client.sendMessage(msg.from, '❌ *Tu carrito esta vacio* ❌ \n *0* .- MENU PRINCIPAL').then((response) => {
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


  client.initialize();
