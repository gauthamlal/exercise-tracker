const express = require('express');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

let port = process.env.PORT || 3000;

mongoose.connect(process.env.MLAB_URI);
mongoose.set('useCreateIndex', true);
let Schema = mongoose.Schema;

const app = express();
app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use('/public', express.static(__dirname + '/public'));

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
