const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    post: {
        type: String,
        default: ""
    },
    timestamp: {
        type: String,
        default: Date.now()
    }
});

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;