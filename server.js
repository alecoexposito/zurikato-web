var express = require('express');  
var app = express();  
  
app.use(express.static("app"));  
  
app.get('/', function (req, res) {  
    res.redirect('/');  
});  
  
app.listen(8000, '0.0.0.0');
console.log("Zurikato web is listening on port 8000");  
