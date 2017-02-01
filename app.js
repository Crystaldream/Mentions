//libraries
const express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var http = require('http');
const path = require('path');
const fs = require('fs');
var jsdom = require('jsdom');

//initialize express
var app = express();

//look for html files in public folder
app.use(express.static(__dirname + '/public'));


//configure body-parser
app.use(bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true }));

//database connection
mongoose.Promise = global.Promise;
var dbPath = 'mongodb://admin:asd123@ds137759.mlab.com:37759/mentions'
mongoose.connect(dbPath);

//check if connection failed
mongoose.connection.on('error',function (err) {
  console.log('Mongoose default connection error: ' + err);
});

//check if connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection disconnected');
});

//close connection if node process ends
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

//Create schemas
var Schema = mongoose.Schema;

var userSchema = new Schema({
  username: String,
  password: String,
  type: String
});

var topicSchema = new Schema({
  title: String,
  description: String,
  user: String,
  likes: Number,
  comments: [{
    user: String,
    comment: String
  }]
},
  {timestamps: {createdAt: 'createdDate',updatedAt: 'updatedDate'}}
);

//models
var User = mongoose.model('User', userSchema);
var Topic = mongoose.model('Topic', topicSchema);

start = "start0";

var default_html = '<!DOCTYPE html>' +
                   '<html>' +
                   '<head>' +
                   '<meta charset="utf-8"/>' +
                   '<title>Mentions</title>' +
                   '</head>' +
                   '<body>' +
                   '<div id=' + start + '>' +
                       '<h1>Welcome to Mentions!</h1>' +
                       '<div><a href="/register">Register</a></div>' +
                       '<div><a href="/login">Login</a></div>' +
                   '</div>' +
                   '</body>' +
                   '</html>';

app.get('/', function(req, res){
  res.send(default_html);
});

app.get('/index/', function(req, res, next){
  var start1 = "start1";
  res.write('<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            '<meta charset="utf-8"/>' +
            '<title>Mentions</title>' +
            '</head>' +
            '<body>' +
            '<div id='
          );

  res.write(start1);

  res.write('>' +
              '<h1>Welcome to Mentions!</h1>' +
              '<div><a href="/topic">Criar Topico</a></div>' +
              '<div><a href="/logout">Logout</a></div>' +
            '</div>' +
            '</body>' +
            '</html>');
  res.end();
  next();
});

app.get('/topic/', function(req, res){

  //buscar topicos base de dados (ainda nao implementado)



  res.send('<!DOCTYPE html>' +
  '<html>' +
  '<head>' +
  '<meta charset="utf-8" />' +
  '<title>Topic</title>' +
  '</head>' +
  '<body>' +
  //insert divs dos topicos here +
  '<div id="contact">' +
      '<h1>Criar novo tópico</h1>' +
      '<form action="/topic" method="post">' +
          '<fieldset>' +
            '<div>' +
              '<label for="title">Title:</label>' +
              '<input type="text" id="title" name="title" placeholder="Title" />' +
            '</div>' +
            '<div>' +
              '<label for="description">Description:</label>' +
              '<textarea rows="4" cols="50" name="description" placeholder="Write something..."></textarea>' +
            '</div>' +

              '<input type="submit" value="Criar novo tópico" />' +

          '</fieldset>' +
      '</form>' +
  '</div>' +
  '</body>' +
  '</html>');
});

app.post('/topic/', function(req, res) {

  var username = fs.readFileSync('tmpdata.txt', 'utf-8');

  var newTopic = Topic({
    title: req.body.title,
    description: req.body.description,
    user: username,
    likes: 0,
    comments: [{
      user: "",
      comment: ""
    }]
  });

  //save to database
  newTopic.save(function(err, Topic){
    if(err) throw err;
  });

  //reload current page
  res.redirect('/index');

});

app.get('/logout/', function(req, res){
  res.redirect('/');
});

app.get('/register/', function(req, res){
  res.redirect('/register.html');
});

//when user submits the registration form
app.post('/register/', function(req, res) {

  var newUser = User({
    username: req.body.username,
    password: req.body.password,
    type: "normal"
  });

  //save to database
  newUser.save(function(err, User){
    if(err) throw err;
  });

  //reload current page
  res.redirect('/');

});

app.get('/login/', function(req, res){
  res.redirect('login.html');
});

app.post('/login/', function(req, res){

  var db_username = "";
  var db_password = "";
  var inserted_user = req.body.username;
  var inserted_password = req.body.password;

  User.findOne({"username": inserted_user}, function(err, user) {

    if(user != null && inserted_user != null && inserted_password != null){
      db_username = user.username;
      db_password = user.password;
    }

    if(db_username === inserted_user && db_password === inserted_password){
      fs.writeFile('tmpdata.txt', inserted_user, function(err){
        if(err){
          return console.log(err);
        }
      });

      res.redirect('/index');
    }else{
      res.redirect('/login.html');
    }

  });

});


app.listen(3000, () => {
  console.log('Server is up on port 3000');
});