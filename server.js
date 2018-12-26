const express = require('express');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const shortid = require('shortid');
const cors = require('cors');
require('dotenv').config();

let port = process.env.PORT || 3000;

mongoose.connect(process.env.MLAB_URI, {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);
let Schema = mongoose.Schema;

const app = express();
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use('/public', express.static(__dirname + '/public'));

let userSchema = new Schema({
  username: {type: String, unique: true},
  userID: {type: String, unique: true, default: shortid.generate},
  exercises: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: {type: String, required: true}
  }]
});

let User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Add a New User
app.post('/api/exercise/new-user', (req, res) => {
  let user = new User({username: req.body.username});
  user.save().then((doc) => {
    res.json({username: doc.username, _id: doc.userID});
  }).catch(err => {
    console.log(err);
    switch (err.code) {
      case 11000:
        res.json({error: 'Username already exists.'});
        break;
      default:
        res.json({error: err.name});
        break;
    }
  });
});

// Add an exercise to a specific user
app.post('/api/exercise/add', (req, res) => {
  console.log('Inside GET /api/exercise/add');
  let userID = req.body.userid;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;
  if (date === "") {
    date = (new Date()).toISOString().slice(0,10);
  }
  User.findOneAndUpdate({userID}, {$push: {exercises: {description, duration, date}}}, {new: true}).then((doc) => {
    // res.json({username: doc.username, description: doc.description, duration: doc.duration, _id: doc.userID, date: doc.date});
    console.log(doc);
    let exercise = doc.exercises[doc.exercises.length-1];
    // res.json({dsfsd: "Waasdsd"});
    console.log(new Date(exercise.date));
    res.json({
      username: doc.username,
      description: exercise.description,
      duration: exercise.duration,
      _id: doc.userID,
      date: new Date(exercise.date)
    });
  }).catch(err => {
    console.log(err);
    res.json({err});
  });
});

app.get('/api/exercise/log', (req, res) => {
  let userID = req.query.userId;
  User.findOne({userID}).then( doc => {
    console.log(doc);
    res.json(doc);
  })
});

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
