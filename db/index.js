const mongoose = require('mongoose');
const { Schema } = mongoose;

/* Define new Schema with types and properties */
const singleImage = new Schema({
  filename: String,
  votes: Number
})

const singleImageModel = mongoose.model('singleImage', singleImage);

module.exports = singleImageModel;
