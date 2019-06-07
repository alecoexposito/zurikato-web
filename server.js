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

app.get('/api/alert-c5', function(req, res) {
    var client = new net.Socket();

    client.on("error", function(error) {
        console.log("Problem connecting to C5 socket");
    });

    // client.connect(29, '187.162.125.161', function() {
    //     console.log('Connected to socket');
    //     client.write(req.query.data);
    // });



    client.connect(4105, '189.203.208.13', function() {
        console.log('Connected to socket');
        client.write(req.query.data);
    });


    console.log(req.query);

    var c5Response = "";
    client.on('data', function(data) {
        console.log("partial response: ", data.toString());
        c5Response += data.toString();
    });
    
    client.once('end', function (data) {
        console.log("complete response: ", c5Response);
        c5Response = "";
        client.destroy();
    });
});

app.get('/', function (req, res) {
    res.redirect('/');
});


  
app.listen(8000, '0.0.0.0');
console.log("Zurikato web is listening on port 8000");
