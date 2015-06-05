/*
 * routes/index.js
 * 
 * Routes contains the functions (callbacks) associated with request urls.
 */

// dependencies
var geocoder = require('geocoder');
var async = require('async');
var extractor = require('email-extractor').Extractor;
var verifier = require('email-verify');

// our db model
var Person = require("../models/model.js");


/**
 * GET '/'
 * Default home route. Just relays a success message back.
 * @param  {Object} req
 * @return {Object} json
 */

exports.index = function (req, res) {

    console.log("main route requested");

    var data = {
        status: 'OK',
        message: 'node RESTful API @grgortiz'
    }

    // respond back with the data
    res.json(data);

}

/**
 * POST '/api/create'
 * Receives a POST request of the new user and location, saves to db, responds back
 * @param  {Object} req. An object containing the different attributes of the Person
 * @return {Object} JSON
 */

exports.create = function (req, res) {

    console.log(req.body);

    // pull out the name and location
    var name = req.body.name;
    var location = req.body.location;

    //now, geocode that location
    geocoder.geocode(location, function (err, data) {

        console.log(data);

        // if we get an error, or don't have any results, respond back with error
        if (err || data.status == 'ZERO_RESULTS') {
            var jsonData = {status: 'ERROR', message: 'Error finding location'};
            res.json(jsonData);
        }

        // otherwise, save the user

        var locationName = data.results[0].formatted_address; // the location name
        var lon = data.results[0].geometry.location.lng;
        var lat = data.results[0].geometry.location.lat;

        // need to put the geo co-ordinates in a lng-lat array for saving
        var lnglat_array = [lon, lat];

        var person = Person({
            name: name,
            locationName: locationName,
            locationGeo: lnglat_array
        });

        // now, save that person to the database
        // mongoose method, see http://mongoosejs.com/docs/api.html#model_Model-save
        person.save(function (err, data) {
            // if err saving, respond back with error
            if (err) {
                var jsonData = {status: 'ERROR', message: 'Error saving person'};
                return res.json(jsonData);
            }

            console.log('saved a new person!');
            console.log(data);

            // now return the json data of the new person
            var jsonData = {
                status: 'OK',
                person: data
            }

            return res.json(jsonData);

        })

    });
}

/**
 * GET '/api/get/:id'
 * Receives a GET request specifying the user to get
 * @param  {String} req.param('id'). The userId
 * @return {Object} JSON
 */

exports.getOne = function (req, res) {

    var requestedId = req.param('id');

    // mongoose method, see http://mongoosejs.com/docs/api.html#model_Model.findById
    Person.findById(requestedId, function (err, data) {

        // if err or no user found, respond with error
        if (err || data == null) {
            var jsonData = {status: 'ERROR', message: 'Could not find that person'};
            return res.json(jsonData);
        }

        // otherwise respond with JSON data of the user
        var jsonData = {
            status: 'OK',
            person: data
        }

        return res.json(jsonData);

    })
}

/**
 * GET '/api/get/:url'
 * Receives a GET request specifying the url to get
 * @param  {String} req.param('url'). The url
 * @return {Object} JSON
 */

//exports.getUrl = function (req, res) {
//
//    var requestedUrl = req.param('url');
//    var jsonData = [];
//    var getUrlAsync = [];
//
//    console.log('Searching ' + requestedUrl + '...');
//
//    extractor('http://' + requestedUrl, function (url, email) {
//        getUrlAsync.push(function (callback) {
//            jsonData[url] = {
//                email: email
//            }
//            console.log(email);
//            callback();
//        });
//    });
//
//    async.parallel(
//        getUrlAsync,
//        function (err, results) {
//            console.log('Done.');
//            return res.json(jsonData);
//        }
//    );
//
//}

/**
 * Validate single email address
 */
exports.validateEmail = function (req, res) {
    var email = req.param('email');
    verifier.verify('' + decodeURI(email) + '', function (err, info) {
        if (err) {
            console.log(decodeURI(email));
        } else {
            var jsonData = {
                status: info.success,
                info: info.info,
                email: decodeURI(email)
            }

            return res.json(jsonData);
        }
    });
}

/**
 * Retrieve email from name
 */
exports.getEmailFromName = function (req, res) {

    var first_name = req.param('first_name');
    var last_name = req.param('last_name');
    var domain = req.param('domain');

    first_name = decodeURI(first_name);
    last_name = decodeURI(last_name);
    domain = decodeURI(domain);

    first_name = first_name.toLowerCase();
    last_name = last_name.toLowerCase();
    var first_initial = first_name.substring(0, 1);
    var last_initial = last_name.substring(0, 1);

    permutations = [
        first_name + '@' + domain,
        last_name + '@' + domain,
        first_initial + '@' + domain,
        last_initial + '@' + domain,
        first_name + '' + last_name + '@' + domain,
        first_name + '.' + last_name + '@' + domain,
        first_initial + '' + last_name + '@' + domain,
        first_initial + '.' + last_name + '@' + domain,
        first_name + '' + last_initial + '@' + domain,
        first_name + '.' + last_initial + '@' + domain,
        first_initial + '' + last_initial + '@' + domain,
        first_initial + '.' + last_initial + '@' + domain,
        last_name + '' + first_name + '@' + domain,
        last_name + '.' + first_name + '@' + domain,
        last_name + '' + first_initial + '@' + domain,
        last_name + '.' + first_initial + '@' + domain,
        last_initial + '' + first_name + '@' + domain,
        last_initial + '.' + first_name + '@' + domain,
        last_initial + '' + first_initial + '@' + domain,
        last_initial + '.' + first_initial + '@' + domain,
        first_name + '-' + last_name + '@' + domain,
        first_initial + '-' + last_name + '@' + domain,
        first_name + '-' + last_initial + '@' + domain,
        first_initial + '-' + last_initial + '@' + domain,
        last_name + '-' + first_name + '@' + domain,
        last_name + '-' + first_initial + '@' + domain,
        last_initial + '-' + first_name + '@' + domain,
        last_initial + '-' + first_initial + '@' + domain,
        first_name + '_' + last_name + '@' + domain,
        first_initial + '_' + last_name + '@' + domain,
        first_name + '_' + last_initial + '@' + domain,
        first_initial + '_' + last_initial + '@' + domain,
        last_name + '_' + first_name + '@' + domain,
        last_name + '_' + first_initial + '@' + domain,
        last_initial + '_' + first_name + '@' + domain,
        last_initial + '_' + first_initial + '@' + domain
    ];

    var n = permutations.length;
    var functionsToRunAsync = [];
    for(var i = 0; i >= n; i++) {
        functionsToRunAsync.push(function (callback) {
            verifier.verify('' + decodeURI(permutations[i]) + '', function (err, info) {
                if (info.success == 'true') {
                    if (err) {
                        console.log(err);
                    } else {
                        var jsonData = {
                            status: info.success,
                            info: info.info,
                            email: decodeURI(permutations[i])
                        }
                        callback();
                    }
                } else {
                    callback();
                }

            });
        });
    }

    async.parallel(
        functionsToRunAsync,
        function (err, results) {    // all async functions complete
            return res.json(jsonData);
        });

}

/**
 * GET '/api/get'
 * Receives a GET request to get all user details
 * @return {Object} JSON
 */

exports.getAll = function (req, res) {

    console.log('getAll');

    // mongoose method, see http://mongoosejs.com/docs/api.html#model_Model.find
    Person.find(function (err, data) {
        // if err or no users found, respond with error
        if (err || data == null) {
            var jsonData = {status: 'ERROR', message: 'Could not find people'};
            return res.json(jsonData);
        }

        // otherwise, respond with the data

        var jsonData = {
            status: 'OK',
            people: data
        }

        res.json(jsonData);

    })

}

/**
 * POST '/api/update/:id'
 * Receives a POST request with data of the user to update, updates db, responds back
 * @param  {String} req.param('id'). The userId to update
 * @param  {Object} req. An object containing the different attributes of the Person
 * @return {Object} JSON
 */

exports.update = function (req, res) {

    var requestedId = req.param('id');

    // pull out the name and location
    var name = req.body.name;
    var location = req.body.location;

    //now, geocode that location
    geocoder.geocode(location, function (err, data) {

        console.log(data);

        // if we get an error, or don't have any results, respond back with error
        if (err || data.status == 'ZERO_RESULTS') {
            var jsonData = {status: 'ERROR', message: 'Error finding location'};
            res.json(jsonData);
        }

        // otherwise, update the user

        var locationName = data.results[0].formatted_address; // the location name
        var lon = data.results[0].geometry.location.lng;
        var lat = data.results[0].geometry.location.lat;

        // need to put the geo co-ordinates in a lng-lat array for saving
        var lnglat_array = [lon, lat];

        var dataToUpdate = {
            name: name,
            locationName: locationName,
            locationGeo: lnglat_array
        };

        // now, update that person
        // mongoose method, see http://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
        Person.findByIdAndUpdate(requestedId, dataToUpdate, function (err, data) {
            // if err saving, respond back with error
            if (err) {
                var jsonData = {status: 'ERROR', message: 'Error updating person'};
                return res.json(jsonData);
            }

            console.log('updated the person!');
            console.log(data);

            // now return the json data of the new person
            var jsonData = {
                status: 'OK',
                person: data
            }

            return res.json(jsonData);

        })

    });

}

/**
 * GET '/api/delete/:id'
 * Receives a GET request specifying the user to delete
 * @param  {String} req.param('id'). The userId
 * @return {Object} JSON
 */

exports.remove = function (req, res) {

    var requestedId = req.param('id');

    // Mongoose method, http://mongoosejs.com/docs/api.html#model_Model.findByIdAndRemove
    Person.findByIdAndRemove(requestedId, function (err, data) {
        if (err || data == null) {
            var jsonData = {status: 'ERROR', message: 'Could not find that person to delete'};
            return res.json(jsonData);
        }

        // otherwise, respond back with success
        var jsonData = {
            status: 'OK',
            message: 'Successfully deleted id ' + requestedId
        }

        res.json(jsonData);

    })

}