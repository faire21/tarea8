'use strict'
const express = require('express');
const cors = require('cors');
const app = express();
const port = 80;
const moment = require('moment');
const fs = require('fs');
const bodyParser = require('body-parser');
var jwt = require('jwt-simple');
app.set('jwtTokenSecret', 'Tarea8Web')
let usuarios = JSON.parse(fs.readFileSync('usuarios.json'));
let productos = JSON.parse(fs.readFileSync('productos.json'));

let jsonParser = bodyParser.json();
var tokens;
let corsOptions = {
    origin: 'http://127.0.0.1:5500',
    optionsSuccessStatus: 200
}
var productosID = productos.length - 1;
app.use(jsonParser);
app.use(cors(corsOptions));
app.use(express.static(__dirname + '/public'));
const log = (req, res, next)=>{
    console.log(`${req.method} ${req.url} ${new Date()}`);
    next();
}
app.use(log);
app.route('/producto')
    .get((req, res) => {
        if (req.query.marca) {
            let productosMarca = [];
            productos.forEach(p => {
                if (p.marca == req.query.marca) {
                    productosMarca.push(p);
                }
            });
            res.json(productosMarca);

        } else {
            res.json(productos)
        }



    })
    .post(auth,(req, res) => {

        if (req.body.nombre != undefined && req.body.marca != undefined &&
            req.body.precio != undefined && req.body.descripcion != undefined && req.body.existencia != undefined) {
            productosID += 1;
            req.body.id = productosID
            productos.push(req.body);


            fs.writeFileSync('productos.json', JSON.stringify(productos));
            res.status(201).send().json(productos[productos.length]);
            return;


        }
        let falla = 'faltan los atributos de ';
        if (req.body.nombre == undefined) {
            falla += 'nombre '
        }
        if (req.body.marca == undefined) {
            falla += 'marca '
        }
        if (req.body.existencia == undefined) {
            falla += 'existencia '
        }
        if (req.body.descripcion == undefined) {
            falla += 'descripcion '
        }
        if (req.body.precio == undefined) {
            falla += 'precio '
        }
        res.status(400).send({
            error: falla
        })

    })

app.route('/producto/:id')
    .get((req, res) => {
        let id = req.params.id;
        let p = productos.find(pr => pr.id == id);
        if (p) {

           return res.send(p)
        }
        res.send({
            error: 'ID no existe'
        })


    }) 
    .patch(auth,(req, res) => {
        let id = req.params.id;
        if (partialUpdateProducto(id, req.body)) {
           return res.send(200);
        } else {
            res.status(400).send({
                error: "no se encontró id o faltan datos"
            });
        }

    })

app.route('/usuario/login')
    .post((req, res) => {
            let pos = usuarios.find(pr => pr.usuario == req.body.usuario);

            if (pos != undefined || pos == []) { 
                if (pos.password == req.body.password) {
                
                    var expires = moment().add(5, 'minutes').valueOf();
                var token = jwt.encode({
                    iss: pos.id,
                    exp: expires
                }, app.get('jwtTokenSecret'));
                tokens= { token: token,
                    expires: expires,
                   usuario: pos}
                res.json({
                   tokens
                })
                res.sendStatus(200);
            }
            res.sendStatus(406);
        }
    })

    app.route('/usuario/logout')
    .post(auth,(req, res) => {
          if(tokens.usuario.usuario == req.body.usuario && tokens.usuario.password == req.body.password)
            tokens= undefined;
           res.sendStatus(204);
    })

    app.route('/token').get((req,res)=>{
        res.json(tokens);

    })



function auth(req, res, next) {
    //let tok = (req.body && req.body.access_token) || (req.query && req.query.access_token) ||
       // (req.headers['x-access-token']);
    if (tokens!= undefined) {
        try {
            //var decoded = jwt.decode(tokens.token, app.get('jwtTokenSecret'));
            if (tokens.expires <= Date.now()) {
                res.send('Access token expired', 400);
            }
            next();


        } catch (err) {
            res.send('No token', 406);
        }
    } else {
        res.send('No hay token', 406);
    }

}

app.listen(port, () => console.log(`Example app listening on port ${port}!`));


function partialUpdateProducto(id, producto) {
    let pos = productos.findIndex(p => p.id == id);

    if (pos >= 0) {
        productos[pos].nombre = (producto.nombre) ? producto.nombre : productos[pos].nombre;
        productos[pos].marca = (producto.marca) ? producto.marca : productos[pos].marca;
        productos[pos].existencia = (producto.existencia) ? producto.existencia : productos[pos].existencia;
        productos[pos].precio = (producto.precio) ? producto.precio : productos[pos].precio;
        productos[pos].descripcion = (producto.descripcion) ? producto.descripcion : productos[pos].descripcion;

        fs.writeFileSync('productos.json', JSON.stringify(productos));
        return true;
    }

    return false;

}




