var Film = require('../models/film');
var Director = require('../models/director');
var Actor = require('../models/actor');
var Genre = require('../models/genre');
var async = require('async');
const { body,validationResult } = require('express-validator');


exports.index = function(req, res) {
    async.parallel({
        films: function(callback) {
            Film.find({}, 'title image_url release_date genre')
            .sort({title : 1})
            .limit(4)
            .populate('genre')
            .exec(callback);
        },
        
        directors: function(callback) {
            Director.find({}, 'first_name surname image_url ')
            .sort({name: 1})
            .limit(4)
            .exec(callback);
        },
    }, function(err, results) {
        res.render('index', { title: 'MovieBox', error: err, films: results.films, directors: results.directors });
    });
};

// Display list of all films.
exports.film_list = function(req, res) {
    Film.find({}, 'title image_url release_date genre')
    .sort({title : 1})
    .populate('genre')
    .exec(function (err, list_films) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('film_list', { title: 'Our Movie Selection', film_list: list_films });
    });
};

// Display detail page for a specific film.
exports.film_detail = function(req, res) {
    async.parallel({
        film: function(callback) {
            Film.findById(req.params.id)
              .populate('director')
              .populate('starring')
              .populate('genre')
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.film==null) { // No results.
            var err = new Error('Film not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('film_detail', { title: results.film.title, film: results.film} );
    });
};

// Display film create form on GET.
exports.film_create_get = function(req, res) {
    // Get all actors, director and genres, which we can use for adding to our movie.
    async.parallel({
        actors: function(callback) {
            Actor.find(callback);
        },
        directors: function(callback) {
            Director.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('film_form', { title: 'Add New Movie', actors: results.actors, directors: results.directors, genres: results.genres });
    });
};

// Handle film create on POST.
exports.film_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre ==='undefined')
            req.body.genre = [];
            else
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    (req, res, next) => {
        if(!(req.body.actor instanceof Array)){
            if(typeof req.body.actor ==='undefined')
            req.body.actor = [];
            else
            req.body.actor = new Array(req.body.actor);
        }
        next();
    },

    (req, res, next) => {
        if(!(req.body.director instanceof Array)){
            if(typeof req.body.director ==='undefined')
            req.body.director = [];
            else
            req.body.director = new Array(req.body.director);
        }
        next();
    },

    // Validate and sanitize fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('actor.*', 'Actor must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('director.*', 'Director must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('image_url').trim().isLength({ min: 1 }).withMessage('Image Url must be specified.')
        .isURL({ protocols: ['https'] }).withMessage('Image Url must be a valid Url'),
    body('release_date', 'Invalid date of release').exists().isISO8601().toDate(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Film object with escaped and trimmed data.
        var film = new Film(
          { title: req.body.title,
            starring: req.body.actor,
            director: req.body.director,
            summary: req.body.summary,
            image_url: req.body.image_url,
            release_date: req.body.release_date,
            genre: req.body.genre
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all actors and genres for form.
            async.parallel({
                actors: function(callback) {
                    Actor.find(callback);
                },
                directors: function(callback) {
                    Director.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (film.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                // Mark our selected actor as checked.
                for (let i = 0; i < results.actors.length; i++) {
                    if (film.starring.indexOf(results.actors[i]._id) > -1) {
                        results.actors[i].checked='true';
                    }
                }
                // Mark our selected director as checked.
                for (let i = 0; i < results.directors.length; i++) {
                    if (film.director.indexOf(results.directors[i]._id) > -1) {
                        results.directors[i].checked='true';
                    }
                }
                res.render('film_form', { title: 'Add New Movie', actors: results.actors, directors: results.directors, genres: results.genres, film: film, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save movie.
            film.save(function (err) {
                if (err) { return next(err); }
                   //successful - redirect to new film record.
                   res.redirect(film.url);
                });
        }
    }
];

// Display film delete form on GET.
exports.film_delete_get = function(req, res) {
    async.parallel({
        film: function(callback) {
            Film.findById(req.params.id).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.film==null) { // No results.
            res.redirect('/catalog/films');
        }
        // Successful, so render.
        res.render('film_delete', { title: 'Delete Movie', film: results.film } );
    });
};

// Handle film delete on POST.
exports.film_delete_post = function(req, res) {
    async.parallel({
        film: function(callback) {
          Film.findById(req.body.filmid).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        Film.findByIdAndRemove(req.body.filmid, function deleteFilm(err) {
            if (err) { return next(err); }
            // Success - go to film list
            res.redirect('/catalog/films')
        })
    });
};

// Display film update form on GET.
exports.film_update_get = function(req, res) {
    // Get film, directors and genres for form.
    async.parallel({
        film: function(callback) {
            Film.findById(req.params.id).populate('director').populate('starring').populate('genre').exec(callback);
        },
        directors: function(callback) {
            Director.find(callback);
        },
        actors: function(callback) {
            Actor.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.film==null) { // No results.
                var err = new Error('Film not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            // Mark our selected genres as checked.
            for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
                for (var film_g_iter = 0; film_g_iter < results.film.genre.length; film_g_iter++) {
                    if (results.genres[all_g_iter]._id.toString()===results.film.genre[film_g_iter]._id.toString()) {
                        results.genres[all_g_iter].checked='true';
                    }
                }
            }
            // Mark our selected directors as checked.
            for (var all_d_iter = 0; all_d_iter < results.directors.length; all_d_iter++) {
                for (var film_d_iter = 0; film_d_iter < results.film.director.length; film_d_iter++) {
                    if (results.directors[all_d_iter]._id.toString()===results.film.director[film_d_iter]._id.toString()) {
                        results.directors[all_d_iter].checked='true';
                    }
                }
            }
            // Mark our selected actors as checked.
            for (var all_a_iter = 0; all_a_iter < results.actors.length; all_a_iter++) {
                for (var film_a_iter = 0; film_a_iter < results.film.starring.length; film_a_iter++) {
                    if (results.actors[all_a_iter]._id.toString()===results.film.starring[film_a_iter]._id.toString()) {
                        results.actors[all_a_iter].checked='true';
                    }
                }
            }
            res.render('film_form', { title: 'Update Film', directors: results.directors, actors: results.actors, genres: results.genres, film: results.film });
        });
};

// Handle film update on POST.
exports.film_update_post = [

    // Convert the genre to an array
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },

    (req, res, next) => {
        if(!(req.body.actor instanceof Array)){
            if(typeof req.body.actor ==='undefined')
            req.body.actor = [];
            else
            req.body.actor = new Array(req.body.actor);
        }
        next();
    },

    (req, res, next) => {
        if(!(req.body.director instanceof Array)){
            if(typeof req.body.director ==='undefined')
            req.body.director = [];
            else
            req.body.director = new Array(req.body.director);
        }
        next();
    },

    // Validate and sanitize fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('actor.*', 'Actor must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('director.*', 'Director must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('image_url').trim().isLength({ min: 1 }).withMessage('Image Url must be specified.')
        .isURL({ protocols: ['https'] }).withMessage('Image Url must be a valid Url'),
    body('release_date', 'Invalid date of release').exists().isISO8601().toDate(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Film object with escaped and trimmed data.
        var film = new Film(
          { title: req.body.title,
            starring: req.body.actor,
            director: req.body.director,
            summary: req.body.summary,
            image_url: req.body.image_url,
            release_date: req.body.release_date,
            genre: req.body.genre,
            _id:req.params.id
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all actors and genres for form.
            async.parallel({
                actors: function(callback) {
                    Actor.find(callback);
                },
                directors: function(callback) {
                    Director.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (film.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                // Mark our selected actor as checked.
                for (let i = 0; i < results.actors.length; i++) {
                    if (film.starring.indexOf(results.actors[i]._id) > -1) {
                        results.actors[i].checked='true';
                    }
                }
                // Mark our selected director as checked.
                for (let i = 0; i < results.directors.length; i++) {
                    if (film.director.indexOf(results.directors[i]._id) > -1) {
                        results.directors[i].checked='true';
                    }
                }
                res.render('film_form', { title: 'Update Film', directors: results.directors, actors: results.actors, genres: results.genres, film: film, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Film.findByIdAndUpdate(req.params.id, film, {}, function (err,thefilm) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thefilm.url);
                });
        }
    }
];
