const express = require('express');
const {check} = require('express-validator')
const router = express.Router();
const HttpError = require('../models/http-error');
const placesController = require('../controllers/places-controllers');

router.get('/', placesController.getPlace); 

//FindById
router.get('/:pid', placesController.getPlaceById);

router.get('/user/:uid', placesController.getPlacesByUserId);

router.post('/', [
    check('name')
    .not()
    .isEmpty(), 
    check('positive')
    .isLength({min: 5}),
    check('address')
    .not()
    .isEmpty()
], placesController.createPlace);

router.patch('/:pid', [
    check('name')
    .not()
    .isEmpty(),
    check('positive')
    .isLength({min: 5}),

],placesController.updatePlace);

router.delete('/:pid', placesController.deletePlace);

module.exports = router;

