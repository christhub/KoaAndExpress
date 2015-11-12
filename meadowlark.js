var express = require('express');

var app = express();

var bridgeFacts = [
  'the bridge is getting you over the river',
  'there is the marquam bridge that carries I-5 over the willamette',
  'the fremont bridge carries I-405 over the willamette',
  'the broadway bridge carries broadway over the willamette',
  'the ross island bridge carries 26 over the willamette river',
  'the sellwood bridge connects sellwood to the other side of the river'
]

// //set-up jade
// app.engine('.html', require('jade'));

//set up handlebars view engine
var handlebars = require('express-handlebars').create({ defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port' , process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
        res.render('home');
});

app.get('/about', function(req, res){
        var randomBridgeFact =
                bridgeFacts[Math.floor(Math.random() * bridgeFacts.length)];
        res.render('about', { bridgeFact: randomBridgeFact });
});
//custom 404 page
app.use(function(req, res){
        res.status(404);
        res.render('404');
});

// custom 500 handler (middleware)
app.use(function(err, req, res, next){
        res.status(500);
        res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.');

});
