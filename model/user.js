const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: { type: String, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now() }
});

userSchema.pre("save", function(next) {
    bcrypt.genSalt(10).then((salt) => {
        bcrypt.hash(this.password, salt).then((ePass) => {
            this.password = ePass;
            next();
        }).catch((err) => {
            console.log(`Err Hash user.js: ${err}`);
        });
    }).catch((err) => {
        console.log(`Err Gen Salt user.js: ${err}`);
    });
});
const userModel = mongoose.model('user', userSchema);
module.exports = userModel;