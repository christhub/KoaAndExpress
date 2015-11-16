var http = require('http'),
 express = require('express'),
 formidable = require('formidable'),
 credentials = require('./credentials.js'),
 bridgeFact = require('./lib/bridgeFact.js'),
 bodyParser = require('body-parser'),
 fs = require('fs'),
 reload = require('reload');

var app = express();

function saveContestEntry(contestName, email, year, month, photoPath){
    //TODO
}

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


// //set-up jade
// app.engine('.html', require('jade'));

//set up handlebars view engine

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port' , process.env.PORT || 3000);

mongoose =  require('mongoose');
var opts = {
  server: {
    socketOptions: { keepAlive: 1 }
  }
};

switch(app.get('env')){
  case 'development':
    mongoose.connect(credentials.mongo.development.connectionString, opts);
    break;
  case 'production':
    mongoose.connect(credentials.mongo.production.connectionString, opts);
    break;
  default:
    throw new Error('Unknown execution envrionment: ' + app.get('env'));
}

// make sure data directory exists
var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if(!fs.existsSync(vacationPhotoDir)) fs.mkdirSync(vacationPhotoDir);


app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
}));
app.use(express.static(__dirname + '/public'));
app.use(require('body-parser')());

app.use(function(req, res, next){
	// if there's a flash message, transfer
	// it to the context, then clear it
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
});

app.use(function(req, res, next){
      res.locals.showTests = app.get('env') !== 'production' &&
                req.query.test == '1';
      next();
});

app.use('/upload', function(req, res, next){
  var now = Date.now();
  jqupload.fileHandler({
    uploadDir: function(){
      return __dirname + 'public/uploads/' + now;
    },
    uploadUrl: function(){
      return '/uploads/' + now;
    },
  })(req, res, next);
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
  res.render('newsletter');
});

app.get('/thank-you', function(req, res){
  res.render('thank-you');
});

//file uploads
app.get('/contest/vacation-photo', function(req, res){
  var now = new Date();
  res.render('contest/vacation-photo', {
    year: now.getFullYear(), month: now.getMonth()
  });
});

//post requests
// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
	cb();
};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app.post('/newsletter', function(req, res){
	var name = req.body.name || '', email = req.body.email || '';
	// input validation
	if(!email.match(VALID_EMAIL_REGEX)) {
		if(req.xhr) return res.json({ error: 'Invalid name email address.' });
		req.session.flash = {
			type: 'danger',
			intro: 'Validation error!',
			message: 'The email address you entered was  not valid.',
		};
		return res.redirect(303, '/newsletter/archive');
	}
	new NewsletterSignup({ name: name, email: email }).save(function(err){
		if(err) {
			if(req.xhr) return res.json({ error: 'Database error.' });
			req.session.flash = {
				type: 'danger',
				intro: 'Database error!',
				message: 'There was a database error; please try again later.',
			};
			return res.redirect(303, '/newsletter/archive');
		}
		if(req.xhr) return res.json({ success: true });
		req.session.flash = {
			type: 'success',
			intro: 'Thank you!',
			message: 'You have now been signed up for the newsletter.',
		};
		return res.redirect(303, '/newsletter/archive');
	});
});

app.get('/newsletter/archive', function(req, res){
	res.render('newsletter/archive');
});

app.post('/process', function(req, res){
  if(req.xhr || req.accepts('json,html')==='json'){
    res.send({ success: true });
  } else {
    res.redirect(303, '/thank-you');
  }
});

app.post('/contest/vacation-photo/:year/:month', function(req, res){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
    if(err){
      res.session.flash = {
      type: 'danger',
      intro: 'Oops!',
      message: 'There was an error processing your submission. ' +
      'Please try again......',
    };
    return res.redirect(303, '/contest/vacation-photo');
    }
    var photo = files.photo;
    var dir = vacationPhotoDir + '/' + Date.now();
    var path = dir + '/' + photo.name;
    fs.mkdirSync(dir);
    fs.renameSync(photo.path, dir + '/' + photo.name);
    saveContestEntry('vacation-photo', fields.email,
      req.params.year, req.params.month, path);
    req.session.flash = {
      type: 'success',
      intro: 'Good Luck!',
      message: 'you have been entered into the contest.',
    };
    return res.redirect(303, '/contest/vacation-photo/entries');
  });
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
