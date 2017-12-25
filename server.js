//GET https://www.googleapis.com/customsearch/v1?key=INSERT_YOUR_API_KEY&cx=017576662512468239146:omuauf_lfve&q=lectures
// Other key AIzaSyABHJPJ6lbBT1Q-eDfvlKZ3U4nazjU29Jk
//Custom Search Engine ID: 006273168582176433013:u4i5ithdvze
//URL: https://www.googleapis.com/customsearch/v1?key=AIzaSyABHJPJ6lbBT1Q-eDfvlKZ3U4nazjU29Jk&cx=006273168582176433013:u4i5ithdvze&q=lolcats
//NEW KEY: AIzaSyCxSAqyQt5IyZEDXxLIFkdtBDy33bGbqAU
function makeRequestURL(query,offset) {
   return googleURL + encodeURIComponent(query) + "&start=" + offset.toString(); 
}
function checkOffset1to90(offset) {
    return offset >= 1 && offset <= 90;
}
function makeOutput(item) {
   var obj = {};
  
    if( item.pagemap.cse_image.length > 0 ) {
          obj["url"] = item.pagemap.cse_image[0].src;
        } else {
          obj["url"] = "Missing";
        }
        if( "snippet" in item ) {
          obj["snippet"] = item.snippet;
        } else {
          obj["snippet"] = "Missing"; 
        }
        if( item.pagemap.cse_image.length > 0 ) {
          obj["thumbnail"] = item.pagemap.cse_thumbnail[0].src; 
        } else {
          obj["thumbnail"] = "Missing"; 
        }
        if( "link" in item ) {
          obj["context"] = item.link;  
        } else {
          obj["context"] = "Missing"; 
        }  
  
   return obj;
}

function updateSearchRecord(search) {
  mongo.connect(dbURL, function (err,db) {
    var date = new Date();
    console.log("Database updated succesfully");
    db.collection("searches").insertOne( 
      { "term" : search, "when" : date.toString() });
    db.close();
  });
}

var express = require('express');
var app = express();
var url = require("url");
var mongo = require("mongodb").MongoClient;
var googleRequest = require("request");
var googleRP = require("request-prom");
var dbURL = "mongodb://image-search:c4rr07qu33n@ds163796.mlab.com:63796/search-record";
var googleURL = "https://www.googleapis.com/customsearch/v1?key=AIzaSyCxSAqyQt5IyZEDXxLIFkdtBDy33bGbqAU&cx=006273168582176433013:u4i5ithdvze&fields=items(pagemap(cse_image(src),cse_thumbnail(src)),snippet,link)&q="  //items(pagemap(cse_image(src),cse_thumbnail(src)),snippet,link)

app.use(express.static('public'));

app.get("/", function (req,res) {
   res.sendFile(__dirname + "/views/index.html");  
});

app.get("/api/imagesearch/:search", function (req,res) {
  /*
  
  var str = "";
  str += "Search term: " + req.params.search;
  str += "Page offset: " + req.query.offset;
  googleRequest.get(googleURL + "lolcats" + "&start=" + req.query.offset).pipe(res);
  
  */
  var query = req.params.search;
  var offset = parseInt(req.query.offset);
  if( isNaN(offset) ) {
    res.send("Offset is not a number.") 
  }
  if( !checkOffset1to90(offset) ) {
     res.send("Offset must be an integer(number without decimal) between 1 and 90.");
  }
  googleRequest.get(makeRequestURL(query,offset), function(error, response, body) {
    if(error) { res.send(error); }
    if( response.statusCode == "200" ) {
      var results = [];
      
      var items = JSON.parse(body).items;
      for(var i = 0; i < items.length; i++ ) {  
        results.push( makeOutput(items[i])); 
      }  
      
      updateSearchRecord(makeRequestURL(query,offset));
      res.send(results);    
    }
    else {
      res.send("There was an error (quota may have been reached)."); 
    }
    
  });
  
});

app.get("/api/latest/imagesearch/", function (req, res) {
  mongo.connect(dbURL, function(err,db) {
    db.collection("searches").find(
      {},
      {"term":1,"when":1}
      ).toArray( function (err,results) {
      if(err) { res.send(err); }
      res.send(results.reverse());
      db.close();
    });
    
  });
});



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
