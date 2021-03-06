'use strict'

var express = require('express');
var md_auth = require('../middlewares/authenticated');
var multipart = require('connect-multiparty');
var UserController = require('../controllers/user');

var router = express.Router();
var md_upload = multipart({ uploadDir: './uploads/users'})

// Rutas de prueba 
router.get('/probando', UserController.probando);
router.post('/testeando', UserController.testeando);

//Rutas de usuarios
router.post('/register', UserController.save);
router.post('/login', UserController.login);
router.put('/user/update', md_auth.authenticated, UserController.update);
router.post('/upload-avatar/:id',[md_auth.authenticated, md_upload] , UserController.uploadAvatar);
router.get('/avatar/:fileName', UserController.avartar);
router.get('/users', UserController.getUsers);
router.get('/user/:userId', UserController.getUser);

module.exports = router; 