const e = require('express');
const { v4: uuidv4 } = require('uuid');
const HttpError = require('../models/http-error')
const {validationResult} = require('express-validator');
const User = require('../models/user');

const getUser = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password');//find and list all except password
    } catch (err) {
        const error = new HttpError('Fetching user failed, please try again', 404);
        return next(error);
    }

    res.json({users: users.map(user => user.toObject({getters: true}))})
}

const signup = async(req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) { 
        console.log(errors)
        return next(
            new HttpError ('Invalid input passed, check it agin', 422)
        )
    };

    const { name, email, password, covid19Positive} = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email});
    } catch (err) {
        const error = new HttpError('There are already a emai, try another one', 500);
        return next(error)
    }

    if(existingUser) {
        const error = new HttpError('user exist, please try another one', 422);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        password,
        covid19Positive,
        places: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Sign up failed', 422);
        return next(error);
    }

    res.status(200).json({user: createdUser.toObject({getters: true})});
}

const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email});
    } catch (err) {
        const error = new HttpError('Login failed', 500);
        return next(error)
    }

    if(!existingUser || existingUser.password !== password) {
        const error = new HttpError('Invalid credential, could not log you in', 401);
        return next(error);
    }

    res.json({message: "login"})
}

exports.getUser = getUser;
exports.signup = signup;
exports.login = login;