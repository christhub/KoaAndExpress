var express = require('express');
var bridgeFact = require('./lib/bridgeFact.js');
var weatherData = require('./lib/weatherData.js');

var app = express();
// //set-up jade
// app.engine('.html', require('jade'));

//set up handlebars view engine
var handlebars = require('express-handlebars')
      .create({
        defaultLayout:'main',
        helpers: {
          section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
          }
        }
      });

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port' , process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.use(require('body-parser')());

app.use(function(req, res, next){
      res.locals.showTests = app.get('env') !== 'production' &&
                req.query.test == '1';
      next();
});

// Partials & weather data
function getWeatherData(){
  return {
      locations: [
          {
              name: 'Portland',
              forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
              iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
              weather: 'Overcast',
              temp: '54.1 F (12.3 C)',
          },
          {
              name: 'Bend',
              forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
              iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
              weather: 'Partly Cloudy',
              temp: '55.0 F (12.8 C)',
          },
          {
              name: 'Manzanita',
              forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
              iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
              weather: 'Light Rain',
              temp: '55.0 F (12.8 C)',
          },
      ],
  };
}

app.use(function(req, res, next){
    var weather = weatherData.getWeatherData();
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = getWeatherData();
    next();
});



app.get('/headers', function(req, res){
res.set('Content-Type', 'text/plain');
var s = '';
for(var name in req.headers) s += name + ': ' + req.headers[name] + '\n';
res.send(s);
});

app.get('/', function(req, res){
      res.render('home');
});

//some routes

app.get('/about', function(req, res){
      res.render('about', {
        bridgeFact: bridgeFact.getBridgeFact(),
        pageTestScript: '/qa/tests-about.js'
      } );
});

//bridge tour page
app.get('/tours/hood-river', function(req, res){
        res.render('tours/hood-river');
});
app.get('/tours/oregon-coast', function(req, res){
        res.render('tours/oregon-coast');
});
app.get('/tours/request-group-rate', function(req, res){
        res.render('tours/request-group-rate');
});

//client-side handlebars

app.get('/jquery-test', function(req, res){
  res.render('jquery-test');
});

app.get('/nursery-rhyme', function(req, res){
      res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function(req, res){
      res.json({
        animal: 'squirrel',
        bodyPart: 'tail',
        adjective: 'bushy',
        noun: 'heck',
      });
});

app.get('/newsletter', function(req, res){
  res.render('newsletter', {csrf: 'CSRF token goes here'});
});

app.get('/thank-you', function(req, res){
  res.render('thank-you')
});

app.post('/process', function(req, res){
  console.log('form (from querystring): '+ req.query.form);
  console.log('CSRF token (from hidden form field): ' + req.body._csrf);
  console.log('Name (from visible form field): ' + req.body.name );
  console.log('email (from visible form field): ' + req.body.email);
  res.redirect(303, '/thank-you');
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
