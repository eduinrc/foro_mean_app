'use strict'

// Requires
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

//Ejecutar express
var app = express();

//Cargar archivos de rutas
var comment_routes = require('./routes/comment');
var topic_routes = require('./routes/topic');
var user_routes = require('./routes/user');

//Middlewares
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


//CORS
// Configurar cabeceras y cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

//Reescribir rutas
//Url Angular limpia
app.use('/', express.static('client', {redirect: false}));

app.use('/api', comment_routes);
app.use('/api', topic_routes);
app.use('/api', user_routes);
//Url Angular limpia
app.get('*', function(req, res, next){
	res.sendFile(path.resolve('client/index.html'));
});

//Agrega # a la url
//app.use(express.static(path.join(__dirname, 'client')));

//Exportar el modulos
module.exports = app;