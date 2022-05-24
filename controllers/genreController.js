var Genre = require('../models/genre');
var Film = require('../models/film');
var async = require('async');
const genre = require('../models/genre');
const { body,validationResult } = require("express-validator");



// Display list of all Genre.
exports.genre_list = function(req, res) {
    Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('genre_list', { title: 'Genre List:', genre_list: list_genres });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_films: function(callback) {
            Film.find({ 'genre': req.params.id })
            .populate('genre')
            .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { genre: results.genre, genre_films: results.genre_films } );
    });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', { title: 'Add New Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [

    // Validate and sanitize the name field.
    body('name', 'Genre name have to be at least 3 characters').trim().isLength({ min: 3 }).escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Add New Genre', genre: genre, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
             if (err) { return next(err); }
  
             if (found_genre) {
               // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             }
             else {
  
               genre.save(function (err) {
                 if (err) { return next(err); }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
  
             }
  
           });
      }
    }
  ];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    async.parallel({
      genre: function(callback) {
          Genre.findById(req.params.id).exec(callback)
      },
      genres_films: function(callback) {
          Film.find({ 'genre': req.params.id }).exec(callback)
      },
    }, function(err, results) {
      if (err) { return next(err); }
      if (results.genre==null) { // No results.
          res.redirect('/catalog/genres');
      }
      // Successful, so render.
      res.render('genre_delete', { title: 'Delete genre', genre: results.genre, genre_films: results.genres_films } );
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    async.parallel({
      genre: function(callback) {
        Genre.findById(req.body.genreid).exec(callback)
      },
      genres_films: function(callback) {
        Film.find({ 'genre': req.body.genreid }).exec(callback)
      },
    }, function(err, results) {
      if (err) { return next(err); }
      // Success
      if (results.genres_films.length > 0) {
          // genre has movies. Render in same way as for GET route.
          res.render('genre_delete', { title: 'Delete genre', genre: results.genre, genre_films: results.genres_films } );
          return;
      }
      else {
          // genre has no films. Delete object and redirect to the list of genres.
          Genre.findByIdAndRemove(req.body.genreid, function deletegenre(err) {
              if (err) { return next(err); }
              // Success - go to genre list
              res.redirect('/catalog/genres')
          })
      }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    // Get genre for form.
    async.parallel({
      genre: function(callback) {
          Genre.findById(req.params.id).exec(callback);
      },
      }, function(err, results) {
          if (err) { return next(err); }
          if (results.genre==null) { // No results.
              var err = new Error('Genre not found');
              err.status = 404;
              return next(err);
          }
          // Success.
          res.render('genre_form', { title: 'Update Genre', genre: results.genre });
      });
};

// Handle Genre update on POST.
exports.genre_update_post = [

  // Validate and sanitize the name field.
  body('name', 'Genre name have to be at least 3 characters').trim().isLength({ min: 3 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/errors messages.
          res.render('genre_form', { title: 'Update Genre', genre: req.body, errors: errors.array() });
          return;
      }
      else {
          // Data from form is valid.
          // Create a genre object with escaped and trimmed data.
          var genre = new Genre(
            { 
              name: req.body.name,
              _id:req.params.id
            });
          Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,theGenre) {
          if (err) { return next(err); }
              // Successful - redirect to genre detail page.
              res.redirect(theGenre.url);
          });
      }
  }
];
