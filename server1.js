
function createTemplate(data) {
  var title = data.title;
  var heading = data.heading;
  var date = data.date;
  var content = data.content;
  var htmlTemplate = `<html>
        <head>
        <link rel="stylesheet" href="css/normalize.css">
        <link rel="stylesheet" href="css/skeleton.css">
            <link href="/ui/style.css" rel="stylesheet" />
            <title> ${title} </title>
         </head>
         <body>
            <div>
                <a href="/"> Home </a>
            </div>
            <hr/>
            <div class="center mobile">
                <h1>
                    ${heading}
                </h1>
            </div>
            <div class="center">
                ${date}
            </div>
            <div class="mobile">
              ${content}
            </div>
        </body>
    </html>`;
  return htmlTemplate;
}

var createbHTML = `
  <html>
    <head>
    <link rel="stylesheet" href="css/normalize.css">
    <link rel="stylesheet" href="css/skeleton.css">
    <link href="/ui/style.css" rel="stylesheet" />
    <title>  Create Blog  </title>
  </head>

  <body>

    <form>

    <legend> Title </legend>
    <input type="text" id="title" />
    <legend> Body </legend>
    <textarea id="content" rows="40" cols="100" ></textarea>
    <br />
    <input id="subbutton" type="submit" value="Submit" />
    </form>

    <script src="https://code.jquery.com/jquery-1.11.1.js"></script>
    <script>
      $("#subbutton").click(function (){
        var title = $("#title").val();
        var content = $("#content").val();
        console.log($("#title").val() + " || " + $("#content").val());
        $.ajax({
          url: '/insertblog',
          type: 'POST',
          data: JSON.stringify({"title":title,"content":content}),
          headers: {
            'Content-Type' : 'application/json'
          },
          statusCode : {
            200 : function () {
              alert("Success");
              window.location.href = "/";
            },
          },
          error: function (xhr, status, err) {
            console.error(status, err.toString());
            alert(err.toString());
            window.location.href = "/";
          }
        });
      });
    </script>
  </body>

  </html>
`;

var indexHTML = `
  <html>
  <head>
  <link rel="stylesheet" href="css/normalize.css">
  <link rel="stylesheet" href="css/skeleton.css">
  </head>
  <body>
    <a href="/create"> Write a Blog </a>
    <br />
    <a href="/articlelist"> View Articles </a>
  </body>
  </html>
`;

var articleHTML = `
  <html>
  <head>
  <link rel="stylesheet" href="css/normalize.css">
  <link rel="stylesheet" href="css/skeleton.css">
  </head>
  <body>
  <ul id="artlist">
  </ul>
  </body>
  <script src="/socket.io/socket.io.js"></script>
  <script src="https://code.jquery.com/jquery-1.11.1.js"></script>
  <script>
    var socket=io();
    socket.emit("get-articles");
    socket.on("articles", function(data){
      console.log(data);
      var x;
      for (x in data) {
        $('#artlist').append('<li>' + '<a href="/articles/'+data[x].id+'">'+data[x].title + '</a>' +' <br /> '+ ' ' + data[x].date);
      }
    });
  </script>
  </html>
`;

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var stringHash = require('string-hash');
var Client = require('mariasql');



var c = new Client({
  host: 'localhost',
  user: 'root',
  password: ''
});

app.use(bodyParser.json());

app.get('/css/:fileName', function (req, res) {
  res.sendFile(__dirname+'/css/'+req.params.fileName);
});

app.get('/', function(req, res) {
  res.send(indexHTML);
});

app.get('/articles/:id', function(req, res) {
  c.query("SELECT * FROM dbmsproj.article WHERE id = :id", {
    id: req.params.id
  }, function(err, result) {
    if (err) {
      res.status(500).send(err.toString());
    } else {
      if (result.length == 0) {
        res.status(404).send('Article not found');
      } else {
        var articleData = result[0];
        res.send(createTemplate(articleData));
      }
    }
  });
});

app.get('/create', function(req, res) {
  res.send(createbHTML);
});

app.get('ui/:id', function(req, res) {
  res.sendFile(__dirname + "/" + req.params.id);
});

app.get('/articlelist', function(req,res) {
  res.send(articleHTML);
});

app.post('/insertblog', function(req, res) {
  console.log(req.body.title + " || " + req.body.content);
  var title = req.body.title;
  var content = req.body.content;
  console.log(stringHash(title));
  console.log(title + " || " + content);
  c.query("CALL dbmsproj.ins(:id,:title,now(),:content)"
  //c.query("INSERT INTO dbmsproj.article VALUES(:id,:title,:title,now(),:content)"
  , {
    id: stringHash(title),
    title: title,
    content: content,
  }, function(err, result) {
    if (err) {
      res.status(500).send(err.toString());
      console.log(err);
    } else {
      res.status(200).send("Created Successfully");
    }
  });
});

io.on('connection', function(socket){
  console.log();
  socket.on("hack", function(){
    console.log("oh no");
  });
	socket.on("get-articles", function(){
    c.query("SELECT id,date,title FROM dbmsproj.article",
    function(err,result){
      if(err) {
        socket.emit("articles", err);
      }
      else {
        console.log(result);
        socket.emit("articles", result);
      }
    });
  });
});

var port = process.env.PORT || 8080;

http.listen(port, function() {
  console.log("working on port " + port);
});
