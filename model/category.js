const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: { type: String, required: true },
  img: { type: String, default:  "/img/product/placeholderImg.png" },
  dateCreated: { type: Date, default: Date.now() }
});

const categoryModel = mongoose.model('category', categorySchema);
module.exports = categoryModel;