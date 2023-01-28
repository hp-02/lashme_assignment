const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        dropDups: true
    },
    password: {
        type: String,
        default: false
    },
    followers: [String],
    following: [String],
    timestamp: {
        type: String,
        default: Date.now()
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;