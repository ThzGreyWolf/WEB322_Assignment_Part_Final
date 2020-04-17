const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, default:  "/img/product/placeholderImg.png" },
  category: { type: Schema.Types.ObjectId, ref: "category" },
  isBS: { type: Boolean, required: true },
  quaitity: { type: Number, default: 0 },
  NumSold: { type: Number, default: 0 },
  dateCreated: { type: Date, default: Date.now() }
});

const productModel = mongoose.model('product', productSchema);
module.exports = productModel;