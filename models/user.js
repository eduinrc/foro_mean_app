'use strict'

var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
	name : String,
	surname: String,
	email: String,
	password: String,
	image: String,
	role: String
});

//Eliminar el retorno de una propiedad cuando se consulta el objeto
UserSchema.methods.toJSON = function(){
	var obj = this.toObject();
	delete obj.password;

	return obj;
}

module.exports = mongoose.model('User', UserSchema);
							// lowercase y pluralizar el nombre
							// users -> documentos (schema)