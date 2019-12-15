'use strict'

var Topic = require('../models/topic');
var validator = require('validator');

var controller = {

	add: function(req, res){
		//Recoger el id del topic de la url
		var topicId = req.params.topicId;

		//find por id del topic
		Topic.findById(topicId).exec((err, topic) =>{
			
			if(err){
				return res.status(500).send({
					status: 'error',
					message:'Error en la petición'
				});							
			}

			if(!topic){
				return res.status(404).send({
					status: 'error',
					message:'No existe el tema'
				});							
			}
			//comprobar el objeto usuario y validar datos
			if(req.body.content){
				try{
					var validate_content = !validator.isEmpty(req.body.content);
				}catch(ex){
					return res.status(200).send({
						message: 'No has comentado nada !!'
					});
				}

				if(validate_content){

					var comment = {
						user: req.user.sub,
						content: req.body.content
					}
					//en la propiedad comment del objeto resultante hacer un push
					topic.comments.push(comment);

					//guardar el topic completo
					topic.save((err) =>{

						if(err){
							return res.status(500).send({
								status: 'error',
								message:'Error al guardar el comentario'
							});							
						}

						//devolver una respuesta
						Topic.findById(topic._id)
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
					});

				}else{
					return res.status(200).send({
						message: 'No se ahn validado los datos del comentario !!'
					});
				}
				
			}
		});

	},

	update: function(req, res){

		//Conseguir el id del comentario que nos llegan por url
		var commentId = req.params.commentId;

		//Recoger datos y validar
		var params = req.body;

		//Validar datos
		try{
			var validate_content = !validator.isEmpty(req.body.content);
		}catch(ex){
			return res.status(200).send({
				message: 'No has comentado nada !!'
			});
		}

		if(validate_content){

			//Find an update de un subdocumento
			Topic.findOneAndUpdate(
				{"comments._id": commentId},
				{
					"$set":{
						"comments.$.content": params.content
					}
				},
				{new: true},
				(err, topicUpdate) => {

					if(err){
						return res.status(500).send({
							status: 'error',
							message:'Error al actualizar el comentario'
						});							
					}
					//Devolver datos
					return res.status(200).send({
						status: 'success',
						topicUpdate
					});
				}
			);
		}

	},

	delete: function(req, res){

		//Sacar el id del topic y del comentario a borrar
		var topicId = req.params.topicId;
		var commentId = req.params.commentId;

		//Buscar el topic
		Topic.findById(topicId, (err, topic) => {

			if(err){
				return res.status(500).send({
					status: 'error',
					message:'Error en la petición'
				});							
			}

			if(!topic){
				return res.status(404).send({
					status: 'error',
					message:'No existe el tema'
				});							
			}

			//Seleccionar el subdocumento (comentario)
			var comment = topic.comments.id(commentId);

			//Borrar comentario
			if(comment){
				comment.remove();

				//Guardar el Topic
				topic.save((err) => {
					if(err){
						return res.status(500).send({
							status: 'error',
							message:'Error en la petición'
						});		
					}

					//devolver una respuesta
					Topic.findById(topic._id)
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
				})
				
			}else{
				return res.status(404).send({
					status: 'error',
					message:'No existe el comentario'
				});
			}

		})

	}
};

module.exports = controller;