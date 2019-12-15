'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = "clave-secreta-para-generar-el-token-1991";

exports.authenticated = function(req, res, next){

	// Comprobar llega autorización
	if(!req.headers.authorization){
		return res.status(403).send({
			message: 'La petición no tiene la cabecera de authorization'
		});
	}
	// Limpiar el Token y quitar comillas
	var token = req.headers.authorization.replace(/['"]+/g,'');

	try{
		// Decodificar Token
		var payload = jwt.decode(token, secret);
		
		//Comprobar expiración del Token 
		if(payload.exp <= moment().unix()){
			return res.status(404).send({
					message: 'El token ha expirado'
			});
		}
	}catch(ex){
		return res.status(404).send({
			message: 'El token no es válido'
		});
	}

	//Adjuntar usuario identificado en la request
	req.user = payload;

	//Pasar a la acción
	next();
}