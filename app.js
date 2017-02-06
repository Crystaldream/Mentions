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

var default_html = '<!DOCTYPE html>' +
                   '<html>' +
                   '<head>' +
                   '<meta charset="utf-8"/>' +
                   '<title>Mentions</title>' +
                   '</head>' +
                   '<body>' +
                   '<div>' +
                       '<h1>Welcome to Mentions!</h1>' +
                       '<div><a href="/register">Register</a></div>' +
                       '<div><a href="/login">Login</a></div>' +
                   '</div>' +
                   '</body>' +
                   '</html>';

app.get('/', function(req, res){
  res.send(default_html);
});

app.get('/topicDetails/:id/:iddel', function(req, res, next){
  Topic.findById(req.params.id, function(err, topic){

    if(err) throw err;

    Topic.findByIdAndUpdate(topic._id,
                 {$pull: {"comments":
                 {
                   _id: req.params.iddel,
                 }}},
               {safe: true, upsert: true},
               function(err, Topic){
                 if(err) throw err;
               },
               res.redirect('/topicDetails/' + req.params.id)
             );

               topic.save(function(err){
                 if(err) res.send(err);
               });

   });

});

app.get('/topicDetails/:id/', function(req, res, next){

  Topic.findById(req.params.id, function(err, topic){

    if(err) throw err;

    var tmpDetails = "";
    var z = "";

    if(topic != null){
      tmpDetails = [topic.title, topic.description, topic.user];
      var topicComments = [];

        var usr = fs.readFileSync('tmpdata.txt', 'utf-8');
        var typ = fs.readFileSync('tmptype.txt', 'utf-8');

        console.log(" -> " + usr);
        console.log(typ);
        console.log(topic.user);

        topic.comments.forEach(function(topic){
          if(usr == topic.user && typ == "admin"){
            topicComments.push('<div id=' + topic._id + '><div>' + topic.user + '</div><div>' + topic.comment + '</div><a href=/topicDetails/' + req.params.id + '/' + topic.id + '/' + '>Remove</a></div>');
          }

          if(usr == topic.user && typ == "normal") {
            topicComments.push('<div id=' + topic._id + '><div>' + topic.user + '</div><div>' + topic.comment + '</div></div>');
          }
        });

      z = "/topicDetails/" + req.params.id;

      var body1 = '<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            '<meta charset="utf-8"/>' +
            '<title>Mentions</title>' +
            '</head>' +
            '<body>' +
            '<div id="contact">' +
            '<h1>Details</h1>' +
            '<div>' +
            '<div>'+
              tmpDetails[0] +
            '</div>' +
            '<div>' +
              tmpDetails[1] +
            '</div>' +
            '<div>' +
            'by: ' +
              tmpDetails[2] +
            '</div>' +
            '</div>' +
            '<div>' +
            '<div>';

      res.write(body1);

      topicComments.forEach(function(topic){
        res.write(topic);
      });

      var body2 = '</div>' +
                  '</div>' +
                  '<form action=' + z + ' method="post">' +
                    '<fieldset>' +
                      '<div>' +
                        '<textarea rows="4" cols="50" name="comentario" placeholder="Write a comment..."></textarea>' +
                      '</div>' +
                      '<input type="submit" value="Submeter Comentário"/>' +
                    '</fieldset>' +
                  '</form>' +
                  '</div>' +
                  '</body>' +
                  '</html>'

      res.write(body2);
      res.end();
      next();

    } else {
      res.redirect("/Topic");
    }

  });

});

app.post('/topicDetails/:id', function(req, res) {

  var username = fs.readFileSync('tmpdata.txt', 'utf-8');

  if(req.body.comentario != ""){

    Topic.findById(req.params.id, function(err, topic){

      if(err) throw err;

      Topic.findByIdAndUpdate(topic._id,
                   {$push: {"comments":
                   {
                     user: username,
                     comment: req.body.comentario
                   }}},
                 {safe: true, upsert: true},
                 function(err, Topic){
                   if(err) throw err;
                 },
                 res.redirect('/topicDetails/' + req.params.id)
               );

                 topic.save(function(err){
                   if(err) res.send(err);
                 });

    });
  }else{
    res.redirect('/topicDetails/' + req.params.id);
  }

});

app.get('/topic/', function(req, res, next){

  var username = fs.readFileSync('tmpdata.txt', 'utf-8');

  Topic.find({}, function(err, topics) {

    var tmp = "";
    var str = "";

    var body1 = '<!DOCTYPE html>' +
              '<html>' +
              '<head>' +
              '<meta charset="utf-8"/>' +
              '<title>Mentions</title>' +
              '</head>' +
              '<body>' +
              '<div>' +
                '<h1>Welcome to Mentions!</h1>' +
                '<div><a href="/newTopic">Criar Topico</a></div>' +
                '<div><a href="/logout">Logout</a></div>' +
              '</div>';

    var body2 = '</body></html>';

    res.write(body1);

    topics.forEach(function(topic) {

      tmp = "/topicDetails/" + topic._id;
      str = '<div><div>' + "<a href=" + tmp + '>' + topic.title + '</a></div>' + '<div>' + topic.createdDate + '</div><div>' + username + '\n' + '</div></div>';

      res.write(str);

    });

    res.write(body2);
    res.end();
    next();

  });

});

app.get('/newTopic/', function(req, res, next){

  res.write('<div id="contact">' +
      '<h1>Criar novo topico</h1>' +
      '<form action="/newTopic" method="post">' +
          '<fieldset>' +
            '<div>' +
              '<label for="title">Title:</label>' +
              '<input type="text" id="title" name="title" placeholder="Title" />' +
            '</div>' +
            '<div>' +
              '<label for="description">Description:</label>' +
              '<textarea rows="3" cols="50" name="description" placeholder="Write something..."></textarea>' +
            '</div>' +

              '<input type="submit" value="Criar novo topico" />' +

          '</fieldset>' +
      '</form>' +
  '</div>' +
  '</body>' +
  '</html>');
  res.end();
  next();
});

app.post('/newTopic/', function(req, res) {

  var username = fs.readFileSync('tmpdata.txt', 'utf-8');

  var newTopic = Topic({
    title: req.body.title,
    description: req.body.description,
    user: username,
    comments: []
  });

  //save to database
  newTopic.save(function(err, Topic){
    if(err) throw err;
  });

  //reload current page
  res.redirect('/Topic');

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

      fs.writeFile('tmptype.txt', user.type, function(err){
        if(err){
          return console.log(err);
        }
      });

      res.redirect('/topic');
    }else{
      res.redirect('/login.html');
    }

  });

});


app.listen(3000, () => {
  console.log('Server is up on port 3000');
});
