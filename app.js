const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const placesRoute = require('./routes/places-routes');
const usersRoute = require('./routes/users-routes');
const HttpError = require('./models/http-error');


const app = express();
const PORT = 5000;

app.use(bodyParser.json());


app.use('/api/places', placesRoute); //=> /api/places
app.use('/api/users', usersRoute); //=> /api/user

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route', 404);
    throw error;
});

//Error Handling
app.use((error, req, res, next) => {
    if(res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({Message: error.message || 'An unknown error occured'});
});

mongoose
    .connect('mongodb+srv://huynhkhai0105:Quynhanh0505@cluster0.hkkuc.mongodb.net/Covid19?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: true,
    })
    .then(() => {
        app.listen(PORT);
    })
    .catch(err => {
        console.log(err)
    });