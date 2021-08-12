const HttpError = require('../models/http-error')
const { validationResult } = require('express-validator');
const Place = require('../models/place');
const User = require('../models/user');
const mongooseUniqueValidator = require('mongoose-unique-validator');
const mongoose = require('mongoose');

const getPlace = async (req, res, next) => {
    let places;
    try {
        places = await Place.find({});//find and list all except password
    } catch (err) {
        const error = new HttpError('Fetching user failed, please try again', 404);
        return next(error);
    }

    res.json({places: places.map(place => place.toObject({getters: true}))})
};

//Function Get Place By Id
const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById({_id: placeId});
    } catch (err) {
        const error = new HttpError ('Something went wrong, could not find id', 500);
        return next(error)
    }

    if(!place) {
       const error = new HttpError('Could Not find a place for the provided Id', 404);
       return next(error);
    } 

    res.json({
        place: place.toObject({getters: true})
    });
};

//Function Get Places by user id (multiple Places)
const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;

    //let places;
    let userWithPlaces;

    try {
        userWithPlaces = await User.findById(userId).populate('places');
    } catch (err) {
        const error = new HttpError('Fetching places fail', 404);
        return next(error);
    }
    
    if(!userWithPlaces || userWithPlaces.places.length === 0) {
        const error = new HttpError('Could Not find a place for the provided user Id', 500);
        return next(error);
    }

    console.log(userWithPlaces.places)
    
    res.json({ 
        places: userWithPlaces.places.map(place => place.toObject({getters: true})) 
    })
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) { 
        return (new HttpError ('Invalid input passed, check it agin', 422))
    }

    const { name, positive, address, coordinate, creator } = req.body;
    const createdPlace = new Place({
        name: name,
        positive: positive,
        address: address,
        location: coordinate,
        creator: creator
    });

    let user;

    try {
        user = await User.findById(creator);
    } catch (err) {
        const error = new HttpError('Creating fail', 500)
        return next(error);
    }

    if(!user) {
        const error = new HttpError('Could not find user for provided Id', 404)
        return next(error);
    }

    try {
       const sess = await mongoose.startSession();
       sess.startTransaction();
       await createdPlace.save({session: sess});
       user.places.push(createdPlace);
       await user.save({session: sess});
       await sess.commitTransaction();
       
    } catch (err) {
        return next(
            new HttpError('creating place fail please try again', 500)
        )
    }

    res.status(201).json({place: createdPlace});
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) { 
        console.log(errors)
        return next(
            new HttpError ('Invalid input passed, check it agin', 422)
        )
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;

    // Find Place by Id and make a  copy of its 
    let place;
    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update place', 500);
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update place', 500);
        return next(error);
    }

    res.status(200).json({place: place.toObject({ getters: true })});

}

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    
    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find place', 500);
        return next(error);
    }

    if(!place) {
        const error = new HttpError('Could not find place for this id', 404);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session: sess});
        place.creator.places.pull(place);
        await place.creator.save({session: sess});
        await sess.commitTransaction();

    } catch (err) {
        const error = new HttpError('Something went wrong, could not find place', 500);
        return next(error);
    }
    
    res.status(200).json({message: 'Deleted place'});
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.getPlace = getPlace;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;