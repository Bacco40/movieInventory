var Director = require('../models/director');
var async = require('async');
var Film = require('../models/film');
const { body,validationResult } = require('express-validator');


// Display list of all Director.
exports.director_list = function(req, res) {
    Director.find()
    .sort([['first_name', 'ascending']])
    .exec(function (err, list_directors) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('director_list', { title: 'Directors List:', director_list: list_directors });
    });
};

// Display detail page for a specific director.
exports.director_detail = function(req, res) {
    async.parallel({
        director: function(callback) {
            Director.findById(req.params.id)
              .exec(callback)
        },
        director_films: function(callback) {
          Film.find({ 'director': req.params.id },'title summary image_url')
          .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage.
        if (results.director==null) { // No results.
            var err = new Error('Director not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('director_detail', { title: results.director.name , director: results.director, director_films: results.director_films } );
    });
};

// Display director create form on GET.
exports.director_create_get = function(req, res) {
    res.render('director_form', { title: 'Add New Director'});
};

// Handle director create on POST.
exports.director_create_post = [

    // Validate and sanitize fields.
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('surname').trim().isLength({ min: 1 }).escape().withMessage('Surname must be specified.')
        .isString('Surname has non-alphanumeric characters.'),
    body('image_url').trim().isLength({ min: 1 }).withMessage('Image Url must be specified.')
        .isURL({ protocols: ['https'] }).withMessage('Image Url must be a valid Url'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('director_form', { title: 'Add New Director', director: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.
            Director.findOne({ 'name': req.body.name , 'surname': req.body.surname })
                .exec( function(err, found_director) {
                    if (err) { return next(err); }
        
                    if (found_director) {
                    // Genre exists, redirect to its detail page.
                    res.redirect(found_director.url);
                    }
                    else {
                        // Create an Actor object with escaped and trimmed data.
                        var director = new Director(
                            {
                                first_name: req.body.first_name,
                                surname: req.body.surname,
                                date_of_birth: req.body.date_of_birth,
                                image_url: req.body.image_url
                            });
                        director.save(function (err) {
                            if (err) { return next(err); }
                            // Successful - redirect to new actor record.
                            res.redirect(director.url);
                        });
                    }
                })
        }
    }
];

// Display director delete form on GET.
exports.director_delete_get = function(req, res) {
    async.parallel({
        director: function(callback) {
            Director.findById(req.params.id).exec(callback)
        },
        directors_films: function(callback) {
            Film.find({ 'director': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.director==null) { // No results.
            res.redirect('/catalog/directors');
        }
        // Successful, so render.
        res.render('director_delete', { title: 'Delete Director', director: results.director, director_films: results.directors_films } );
    });
};

// Handle director delete on POST.
exports.director_delete_post = function(req, res) {
    async.parallel({
        director: function(callback) {
          Director.findById(req.body.directorid).exec(callback)
        },
        directors_films: function(callback) {
          Film.find({ 'director': req.body.directorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.directors_films.length > 0) {
            // Director has movies. Render in same way as for GET route.
            res.render('director_delete', { title: 'Delete Director', director: results.director, director_films: results.directors_films } );
            return;
        }
        else {
            // Director has no films. Delete object and redirect to the list of directors.
            Director.findByIdAndRemove(req.body.directorid, function deleteDirector(err) {
                if (err) { return next(err); }
                // Success - go to director list
                res.redirect('/catalog/directors')
            })
        }
    });
};

// Display director update form on GET.
exports.director_update_get = function(req, res) {
    // Get directors for form.
    async.parallel({
        director: function(callback) {
            Director.findById(req.params.id).exec(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.director==null) { // No results.
                var err = new Error('Director not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            res.render('director_form', { title: 'Update Director', director: results.director });
        });
};

// Handle director update on POST.
exports.director_update_post = [

    // Validate and sanitize fields.
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('surname').trim().isLength({ min: 1 }).escape().withMessage('Surname must be specified.')
        .isString('Surname has non-alphanumeric characters.'),
    body('image_url').trim().isLength({ min: 1 }).withMessage('Image Url must be specified.')
        .isURL({ protocols: ['https'] }).withMessage('Image Url must be a valid Url'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('director_form', { title: 'Update Director', director: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.
            // Create a Director object with escaped and trimmed data.
            var director = new Director(
                {
                    first_name: req.body.first_name,
                    surname: req.body.surname,
                    date_of_birth: req.body.date_of_birth,
                    image_url: req.body.image_url,
                    _id:req.params.id
                });
            Director.findByIdAndUpdate(req.params.id, director, {}, function (err,theDirector) {
            if (err) { return next(err); }
                // Successful - redirect to book detail page.
                res.redirect(theDirector.url);
            });
        }
    }
];
