var express = require('express');  
var app = express();
// var bodyParser = require('body-parser');
var net = require('net');

app.use(express.static("app"));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}) );

app.all("/*", function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
});
console.log("serverrrrrrrr");
var client = new net.Socket();

client.on("error", function(error) {
    console.log("Problem connecting to C5 socket");
});
app.get('/api/alert-c5', function(req, res) {
    client.connect(4105, '127.0.0.1', function() {
        console.log('Connected to socket');
    });
    res.send('yeappppp');
    console.log(req.query);
    client.write(req.query.data);
    client.end();
});

app.get('/', function (req, res) {
    res.redirect('/');
});


  
app.listen(8000, '0.0.0.0');
console.log("Zurikato web is listening on port 8000");  
