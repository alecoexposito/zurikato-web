var express = require('express');  
var app = express();
var bodyParser = require('body-parser');

app.use(express.static("app"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}) );

app.get('/', function (req, res) {
    res.redirect('/');
});

app.all("/*", function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
});
  


app.get('/alert-c5', function(req, res) {
    res.send('yeappppp');
});
  
app.listen(8000, '0.0.0.0');
console.log("Zurikato web is listening on port 8000");  
