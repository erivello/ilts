#!/usr/bin/env node

var express = require('express');

//var models = require('./models');
//var routes = require('./routes');
//var views = require('./views');

var app = express();

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);	
	app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res){
  res.render('index');
});

app.listen(3000);