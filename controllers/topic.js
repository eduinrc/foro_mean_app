'use strict'

var validator = require('validator');
var Topic = require('../models/topic');

var controller = {

	test: function(req, res){
		return res.status(200).send({
			message: 'Hola que tal'
		});
	},

	save: function(req, res){

		//Recoger parametros por post
		var params = req.body;

		//Validar los datos
		try{
			var validate_title = !validator.isEmpty(params.title);
			var validate_content = !validator.isEmpty(params.content);
			var validate_lang = !validator.isEmpty(params.lang);
		}catch(ex){
			return res.status(200).send({
				message: "Faltan datos por enviar"
			});
		}

		if(validate_title && validate_content && validate_lang){
			//Crear objeto
			var topic = new Topic();

			//Asignar valores
			topic.title = params.title;
			topic.content = params.content;
			topic.code = params.code;
			topic.lang = params.lang;
			topic.user = req.user.sub;

			//Guardar topic
			topic.save(topic,(err, topicStore) => {

				//Devolver una respuesta
				if(err || !topicStore){
					return res.status(404).send({
						status: 'error',
						message: 'El tema no se ha guardado'
					});
				}else{					
					return res.status(200).send({
						status: 'sucess',
						topicStore
					});
				}
			});
		}else{
			return res.status(404).send({
				message: 'los datos no son validos'
			});
		}
	},

	getTopics: function(req, res){

		//Cargar la libreria de paginacion en el modelo
		//Recoger la pagina actual
		var page;		
		if(!req.params.page || req.params.page == null || req.params.page == 0 ||req.params.page == "0" || req.params.page == undefined ){
			page = 1;
		}else{
			page = parseInt(req.params.page); 
		}

		//Indicar las opciones de paginación
		var options = {
			sort: {date: -1},//mas nuevo a mas viejo
			populate: 'user',//Cargar el objeto completo user
			limit: 5,
			page: page
		};


		//Find paginado
		Topic.paginate({}, options, (err, topics)=> {

			if(err){
				return res.status(500).send({
					status: 'error',
					message: 'Error al ahcer la consulta'
				});		
			}

			if(!topics){
				return res.status(500).send({
					status: 'notfound',
					message: 'No hat topics'
				});		
			}

			//Devolver resultado (topics, total topics, total de paginas)
			return res.status(200).send({
					status: 'succes',
					topics: topics.docs,
					totalDocs: topics.totalDocs,
					totalPages: topics.totalPages
				});			

		});
	},

	getTopicsByUser: function(req, res){
		//Coseguir el id del usario
		var userId = req.params.user;

		//Find con una condición de usuario
		Topic.find({
			user: userId
		})
		.sort([['date', 'descending']])
		.exec((err, topics) =>{
			if(err){
				return res.status(500).send({
					status: 'error',
					message: 'Error en la petición'
				});
			}

			if(!topics){
				return res.status(404).send({
					status: 'error',
					message: 'No hay temas para mostrar'
				});
			}

			//
			return res.status(200).send({
				status: 'sucess',
				topics
			});
		});
	},

	getTopic: function(req, res){
		//Sacar el id del topic de la url
		var topicId = req.params.id;

		//Find del ide del topic
		Topic.findById(topicId)
			 .populate('user')
			 .populate('comments.user')
			 .exec((err, topic) => {
				
				if(err){
					return res.status(500).send({
						status: 'error',
						message: 'Error en la petición'
					});
				}

				if(!topic){
					return res.status(404).send({
						status: 'error',
						message: 'No existe el tema'
					});	
				}
				//Devolver el resultado
				return res.status(200).send({
					status: 'sucess',
					topic
				});			 	
			 });

	},

	update: function(req, res){
		//Recoger el id del Topic
		var topicId = req.params.id;

		//Recoger los datos desde post
		var params = req.body;

		//Validar datos
		try{
			var validate_title = !validator.isEmpty(params.title);
			var validate_content = !validator.isEmpty(params.content);
			var validate_lang = !validator.isEmpty(params.lang);
		}catch(ex){
			return res.status(500).send({
				message: "Faltan datos por enviar"
			});
		}

		if(validate_title && validate_content && validate_lang){
			//Montar un json con los datos modificables
			var update = {
				title: params.title,
				content: params.content,
				code: params.code,
				lang: params.lang
			};

			//Find and update del topic por id y por id de usuario
			Topic.findOneAndUpdate({_id: topicId, user: req.user.sub}, update, {new: true}, (err, topicUpdated) => {
				if(err){
					return res.status(500).send({
						status: 'error',
						message: 'Error en la petición'
					});
				}

				if(!topicUpdated){
					return res.status(404).send({
						status: 'error',
						message: 'No se ha actualizado el tema'	
					});
				}

				//Devolver una respuesta
				return res.status(200).send({
					status: 'sucess',
					topic: topicUpdated
				});
			});
		}else{
			return res.status(404).send({
				message: 'Los datos no son validos'
			});
		}
	},

	delete: function(req, res){
		//Sacar el id del topic del la url
		var topicId = req.params.id;

		//Hacer un find an delete por topic id y por user id
		Topic.findOneAndDelete({_id: topicId, user: req.user.sub}, (err, topicRemoved) => {

			if(err){
				return res.status(500).send({
					status: 'error',
					message: 'Error en la petición'
				});
			}

			if(!topicRemoved){
				return res.status(404).send({
					status: 'error',
					message: 'No se ha borrado el tema'	
				});
			}

			//devolver una respuesta
			return res.status(200).send({
				status: 'sucess',
				topic: topicRemoved
			});

		});
	},

	search: function(req, res){

		//Sacar el string a buscar de la url
		var searchString = req.params.search;

		//Find con un operador or
		Topic.find({ "$or": [
			{"title": { "$regex": searchString, "$options": "i"} },
			{"content": { "$regex": searchString, "$options": "i"} },
			{"code": { "$regex": searchString, "$options": "i"} },
			{"lang": { "$regex": searchString, "$options": "i"} }
		]})
		.populate('user')
		.sort([['date', 'descending']])
		.exec((err, topics) => {

			if(err){
				return res.status(500).send({
					status: 'error',
					message: 'Error en la petición'
				});
			}

			if(!topics){
				return res.status(404).send({
					status: 'error',
					message: 'No hay temas disponibles'	
				});
			}

			//Devolver el resultado
			return res.status(200).send({
					status: 'success',
					topics
				});
		});
	}
};

module.exports = controller;