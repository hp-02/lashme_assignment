require('dotenv').config()
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
require('./auth/passport');
const api = require('./api');
const morgan = require('morgan');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json())

const viewpath = __dirname + '/views/';
app.use(express.static(viewpath));

app.use('/users', api);

const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to DB"))
    .catch((err) => console.log(err));

module.exports = app;