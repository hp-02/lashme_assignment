const passport = require('passport');
const passportJwt = require('passport-jwt');
const User = require('../models/users');
const ExtractJwt = passportJwt.ExtractJwt;
const StrategyJwt = passportJwt.Strategy

passport.use(new StrategyJwt({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}, async function (jwtPayload, done) {
    try {
        const user = await User.findById(jwtPayload.id, '-followers -following -password');
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));