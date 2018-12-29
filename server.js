const express = require('express');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const shortid = require('shortid');
const cors = require('cors');
const moment = require('moment');
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
  date = new Date(date).toISOString();
  User.findOneAndUpdate({userID}, {$push: {exercises: {description, duration, date}}}, {new: true}).then((doc) => {
    let exercise = doc.exercises[doc.exercises.length-1];
    console.log(new Date());
    res.json({
      username: doc.username,
      description: exercise.description,
      duration: exercise.duration,
      _id: doc.userID,
      date: moment(exercise.date).format('ddd MMM D Y')
    });
  }).catch(err => {
    console.log(err);
    res.json({err});
  });
});

app.get('/api/exercise/log', (req, res) => {
  let userID = req.query.userId;
  let limit = req.query.limit;
  console.log('userID', userID);
  console.log(typeof limit);
  let matchQuery = {};
  let conditionalQuery = [];
  if (req.query.from) {
    let from = new Date(req.query.from).toISOString();
    matchQuery.$gt = from;
    conditionalQuery.push({ "$gt": [ "$$exercise.date", from ] });
  }
  if (req.query.to) {
    let to = new Date(req.query.to).toISOString();
    matchQuery.$lt = to;
    conditionalQuery.push({ "$lt": [ "$$exercise.date", to ] });
  }
  let matchObject = {userID};
  if (matchQuery.$gt || matchQuery.$lt) {
    matchObject["exercises.date"] = matchQuery
  } else {
    console.log('Empty Object');
  }
  console.log(matchObject);
  let query = [
    {
      "$match": matchObject
    },
    {
      "$project": {
        "_id": "$userID",
        "username": 1,
        "exercises": {
          "$map": {
            "input": {
              "$filter": {
                "input": "$exercises",
                "as": "exercise",
                "cond": {
                  "$and": conditionalQuery
                }
              }
            },
            "as": "exercise",
            "in": {
              "description": "$$exercise.description" ,
              "duration": "$$exercise.duration" ,
              "date": "$$exercise.date"
            }
          }
        }
      }
    },
    { $unwind: '$exercises' },
    {
      "$sort": {
        "exercises.date": -1
      }
    },
    {
      $group: {
        "_id": "$_id",
        "username": {$first: "$username"},
        'exercises': {
          $push: '$exercises'
        }
      }
    }
  ];
  if (limit) {
    console.log('inside limit');
    query.splice(4, 0, {$limit: Number(limit)});
  }
  console.log('query', query);
  User.aggregate(query).then( doc => {
    console.log(doc);
    if (!doc[0]) return res.status(404).send('Invalid UserId');
    doc[0].exercises.forEach(exerciseLog => {
      exerciseLog.date = moment(exerciseLog.date).format('ddd MMM D Y')
    });
    res.json(doc[0]);
  }).catch(err => {
    console.log(err);
    res.json({
      err,
      username: userID
    });
  });
});

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
