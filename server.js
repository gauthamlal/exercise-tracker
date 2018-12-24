const express = require('express');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
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
  username: {type: String, unique: true}
});

let User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/exercise/new-user', (req, res) => {
  console.log(req.body.username);
  let user = {username: req.body.username};
  User.create(user, (err, data) => {
    if (err) {
      console.log(err);
      res.json({error: err});
    } else {
      console.log(data);
      res.json({username: data.username, _id: data._id});
    }
  });
  // res.json({username: req.body.username});
});

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
