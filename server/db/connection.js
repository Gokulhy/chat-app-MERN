
const mongoose=require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const Conversation = require('../modules/conversation');
const { mongoUri } = require('./config');

mongoose.connect(
  mongoUri,
    { }
  ).then(() => {
    console.log('Db connected');
  }).catch((err) => {
    console.log('err', err);
  });
