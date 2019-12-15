'user strict'

var validator = require('validator');
var User = require('../models/user');
var bcrypt = require('bcrypt');
var fs = require('fs');
var path = require('path');
var jwt = require('../services/jwt');

var controller = {

	probando: function(req, res){
		return res.status(200).send({
			message: "Soy el método probando" 
		});
	},

	testeando: function(req, res){
		return res.status(200).send({
			message: "Soy el método testeando" 
		});
	},

	save: function(req,res){
		//Recoger los parametros de la petición
		var params = req.body;

		try{
			//Validar los datos
			var validate_name = !validator.isEmpty(params.name);
			var validate_surname = !validator.isEmpty(params.surname);
			var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
			var validate_password = !validator.isEmpty(params.password);
		}catch(ex){
			return res.status(200).send({
				message: "Faltan datos por enviar"
			});
		}

		//console.log(validate_name, validate_surname, validate_email, validate_password);
		if(validate_name && validate_surname && validate_email && validate_password){
			//Crear objeto usuario
			var user = new User();

			//Asignar valores al objeto
			user.name = params.name;
			user.surname = params.surname;
			user.email = params.email.toLowerCase();
			user.role = 'ROLE_USER';
			user.imagen = null;

			//Comporbar si el usuario ya existe
			User.findOne({email: user.email}, (err, issetUser) =>{
				if(err){
					return res.status(500).send({
						message: "Error al comprobar duplicidad de usuario"
					});
				}
				if(!issetUser){
					//Si no existe
					//Cifrar la contraseña
					user.password = bcrypt.hashSync(params.password, 10);

					//Guardar usuario
					user.save((err, userStored) => {
						if(err){
							return res.status(500).send({
								message: "Error al guardar el usuario"						
							});	
						}

						if(!userStored){
							return res.status(400).send({
								message: "El usuario no se ha guardado"						
							});	
						}
						//Devolver respuesta
						return res.status(200).send({
							status: 'success',
							user: userStored
						});
					})	
				}else{
					return res.status(500).send({
						message: "El usuario ya esta registrado"
					});
				}	
			});
		}else{
			return res.status(200).send({
				message: "Validación de los datos del usario incorrectoa, intentalo de nuevo"
			});
		}
	},
	
	login: function(req, res){
		//Recoger los parametros de la peticion
		var params =  req.body;

		try{
			//Validar los datos
			var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
			var validate_password = !validator.isEmpty(params.password);
		}catch(ex){
			return res.status(200).send({
				message: "Faltan datos por enviar"
			});
		}

		if(!validate_email || !validate_password){
			return res.status(200).send({
				message: "Los datos son incorrectos, envialos bien"
			});
		}
		
		//Validar usuarios que coincidan con el email
		User.findOne({email: params.email.toLowerCase()}, (err, user) => {
			if(err){
				return res.status(500).send({
					message: "Error al intentar identificarse"
				});
			}

			if(!user){
				return res.status(404).send({
					message: "El usuario no existe"
				});
			}

			//si lo encuentra
			//Comprobar la contraseña (coincidencia de email y password / bcrypt)
			bcrypt.compare(params.password, user.password, (err, check) => {
				//Si es correcto
				if(check){
					//Generar un token de jwt y devolverlo (mas tarde)
					if(params.gettoken){
						return res.status(200).send({
							token: jwt.createToken(user)
						});
					}

					//Limpiar el objeto
					user.password = undefined;

					//Devolver los datos

					return res.status(200).send({
						status: "success",
						user
					});
				}else{
					return res.status(500).send({
						message: "Credenciales no son correctas"
					});
				}
			});
		});

			
	},

	update: function(req, res){
		//Recoger los datos del usario
		var params = req.body;

		//Validar Datos
		try{
			var validate_name = !validator.isEmpty(params.name);
			var validate_surname = !validator.isEmpty(params.surname);
			var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);

			//Eliminar propiedades innecesarias
			delete params.password;

			var userId = req.user.sub;

			//Comprobar si el email es unico
			if(req.user.email != params.email){
				User.findOne({email: params.email.toLowerCase()}, (err, user) => {
					if(err){
						return res.status(500).send({
							message: "Error al intentar identificarse"
						});
					}

					if(user){
						return res.status(200).send({
							message: "El email no puede ser modificado"
						});	
					}else{
						//Buscar y actualizar documetnod ela base de datos
						User.findOneAndUpdate({_id: userId}, params, {new: true}, (err, userUpdated) => {

							if(err){
								return res.status(500).send({
									status: 'error',
									message: 'Error al actualizar usuario'
								});
							}

							if(!userUpdated){
								return res.status(500).send({
									status: 'error',
									message: 'Error al actualizar usuario'
								});
							}

							//Devolver una repuesta
							return res.status(200).send({
								status: 'sucess',
								user: userUpdated
							});
						});
					}
				});
			}else{
				//Buscar y actualizar documetnod ela base de datos
				User.findOneAndUpdate({_id: userId}, params, {new: true}, (err, userUpdated) => {

					if(err){
						return res.status(500).send({
							status: 'error',
							message: 'Error al actualizar usuario'
						});
					}

					if(!userUpdated){
						return res.status(500).send({
							status: 'error',
							message: 'Error al actualizar usuario'
						});
					}

					//Devolver una repuesta
					return res.status(200).send({
						status: 'sucess',
						user: userUpdated
					});
				});
			}

		}catch(ex){
			console.error(ex);
			return res.status(200).send({
				message: "Faltan datos por enviar"
			});
		}
	},

	uploadAvatar: function(req, res){
		//Configurar el modulo multiparty(md) /rutes/user.js

		//Rqcoger el fichero de la peticion
		var file_name = 'Avatar no subido...'

		if(!req.files){
			return res.status(4040).send({
				status: 'error',
				message: file_name
			});
		}

		//Conseguir el nombre y la extension del archuvo subido
		//var file_path = req.files.file0.path;
		//Advertencia  ** en windows
		//var file_split = file_path.split('\\');

		//Advertencia  ** en linux o mac
		var file_split = file_path.split('/');

		//Nombre del archivo
		var file_name =  file_split[2];

		//Extencion del archivo
		var ext_split = file_name.split('.');
		var file_ext =  ext_split[1];

		//Comprobar extensión(solo imagenes),
		if(file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg' && file_ext != 'gif'){
			fs.unlink(file_path, (err) => {
				return res.status(200).send({
					status: 'sucess',
					message: 'La extención del archivo no es valida'
				});
			});
		}else{
			//Sacar el id del usuario identificado
			var userId = req.user.sub;


			//Buscar y actulizar documento bd
			User.findOneAndUpdate({_id: userId}, {image: file_name},{new: true},(err, userUpdated) => {
				
				if(err || !userUpdated){
					//Devolver respuesta
					return res.status(500).send({
						status: 'error',
						message: 'Error al guardar el usuario'
					});
				}

				//Devolver una repuesta
				return res.status(200).send({
					status: 'sucess',
					user: userUpdated
				});				
			});
		}
	},

	avartar: function(req,res){
		var fileName = req.params.fileName;
		var pathFile = './uploads/users/'+fileName;

		fs.exists(pathFile, (exists) => {
			if(exists){
				return res.sendFile(path.resolve(pathFile));
			}else{
				return res.status(400).send({
					message: 'La imagen no existe'
				});	
			}
		})
	},

	getUsers: function(req, res){
		User.find().exec((err, users) => {
			if(err || !users){
				return res.status(404).send({
					status: 'error',
					message: 'No hay usuario creados'
				});	
			}

			return res.status(200).send({
				status: 'sucess',
				users
			});
		});

	},

	getUser: function(req, res){
		var userId = req.params.userId;

		User.findById(userId).exec((err, user) => {
			if(err || !user){
				return res.status(404).send({
					status: 'error',
					message: 'No existe el usuario'
				});	
			}

			return res.status(200).send({
				status: 'sucess',
				user
			});
		});
	}
};

module.exports = controller;