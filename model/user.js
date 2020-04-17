const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: { type: String, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now() }
});

const userModel = mongoose.model('user', userSchema);
module.exports = userModel;