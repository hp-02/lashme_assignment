const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Post = require('../models/posts');
const crypto = require("crypto");
const jwt = require('jsonwebtoken');
const passport = require('passport');

router.post('/', async (req, res) => {
    const { username, password } = req.body;
    if (!username) return res.status(409).send({ message: "please provide username" });
    if (!password || password.length < 8) return res.status(400).send({ message: "please check password and it should be more than 8 character" });
    const cryptedPassword = crypto.createHash("sha256").update(password).digest("hex");
    User.create({ username: username, password: cryptedPassword }, function (err, docs) {
        if (err) return res.status(400).send({ message: "username already present" });
        return res.json(req.body);
    });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username) return res.status(409).send({ message: "please provide username" });
    if (!password || password.length < 8) return res.status(400).send({ message: "please check password and it should be more than 8 character" });
    try {
        const user = await User.findOne({ username: username }, '-followers -following');
        if (user.password !== crypto.createHash("sha256").update(password).digest("hex"))
            return res.status(401).send({ message: "Unauthorized access" });
        req.body.userId = user._id.toString();
        const jwt_token = jwt.sign({ id: user._id.toString(), username: user.username }, process.env.JWT_SECRET);
        res.json({ access_token: jwt_token });
    } catch (err) {
        return res.status(401).send({ message: "Unauthorized access" });
    }
});

router.get('/me', passport.authenticate('jwt', { session: false }), async function (req, res) {
    return res.json(req.user);
});

router.post('/posts', passport.authenticate('jwt', { session: false }), async function (req, res) {
    const user_id = req.user._id.toString();
    let { post } = req.body;
    if (!post) return res.status(400).send({ message: "please add a post" });
    post = post.substring(0, 250);
    Post.create({ user_id: user_id, post: post }, function (err, docs) {
        if (err) return res.status(400).send({ message: err });
        return res.json(docs);
    });
});

router.get('/user_id/:user_id', passport.authenticate('jwt', { session: false }), async function (req, res) {
    const { user_id } = req.params;
    const user = await User.findById(user_id, '-password');
    user.followerCount = user.followers.length;
    user.followingCount = user.following.length;
    delete user.followers;
    delete user.following;
    return res.json(user);
});

router.get('/:user_id/posts', passport.authenticate('jwt', { session: false }), async function (req, res) {
    const { user_id } = req.params;
    const posts = await Post.find({ user_id: user_id });
    return res.json(posts);
});

router.post('/:user_id/follow', passport.authenticate('jwt', { session: false }), async function (req, res) {
    const { user_id } = req.params;
    if (user_id === req.user._id.toString()) return res.status(400).send({ message: 'following yourself not allowed' });
    const followed_user = await User.findById(user_id);
    if (!followed_user) return res.status(400).send({ message: 'following user not found' });
    followed_user.followers.indexOf(req.user._id.toString()) === - 1 &&
        followed_user.followers.push(req.user._id.toString());
    followed_user.save();
    const user = await User.findById(req.user._id.toString());
    user.following.indexOf(user_id) === -1 && user.following.push(user_id);
    user.save();
    return res.json({ message: "started following the user" });
});

router.get('/:user_id/following', passport.authenticate('jwt', { session: false }), async function (req, res) {
    const { user_id } = req.params;
    const user = await User.findById(user_id);
    if (!user) return res.status(400).send({ message: 'user not found' });
    const following = [];
    if (user.following.length === 0) return res.json([]);
    user.following.forEach(async (user_id, index) => {
        const followed_user = await User.findById(user_id, '-followers -following -password -__v');
        following.push(followed_user);
        console.log(followed_user);
        if (index + 1 === user.following.length)
            return res.json(following);
    });
});

router.get('/:user_id/followers', passport.authenticate('jwt', { session: false }), async function (req, res) {
    const { user_id } = req.params;
    const user = await User.findById(user_id);
    if (!user) return res.status(400).send({ message: 'user not found' });
    const followers = [];
    if (user.followers.length === 0) return res.json([]);
    user.followers.forEach(async (user_id, index) => {
        const following_user = await User.findById(user_id, '-followers -following -password -__v');
        followers.push(following_user);
        if (index + 1 === user.followers.length)
            return res.json(followers);
    });
});

router.delete('/:user_id/follow', passport.authenticate('jwt', { session: false }), async function (req, res) {
    const { user_id } = req.params;
    const followed_user = await User.findById(user_id);
    if (!followed_user) return res.status(400).send({ message: 'following user not found' });
    followed_user.followers = followed_user.followers.filter(user_id => user_id !== req.user._id.toString());
    followed_user.save();
    const user = await User.findById(req.user._id.toString());
    user.following = user.following.filter(id => id !== user_id);
    user.save();
    return res.json({ message: "unfollowed the user" });
});

router.get('/:username', passport.authenticate('jwt', { session: false }), async function (req, res) {
    const { username } = req.params;
    const user = await User.findOne({ username: username }, '-password');
    if (!user) return res.status(400).send({ message: 'username not found' });
    return res.json({
        username: username,
        _id: user._id,
        follow: user.followers.indexOf(req.user._id.toString()) !== -1,
        followerCount: user.followers.length,
        followingCount: user.following.length,
        timestamp: user.timestamp
    });
});

module.exports = router;