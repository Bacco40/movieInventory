var Actor = require('../models/actor');
var async = require('async');
var Film = require('../models/film');
const { body,validationResult } = require('express-validator');


// Display list of all actor.
exports.actor_list = function(req, res) {
    Actor.find()
    .sort([['first_name', 'ascending']])
    .exec(function (err, list_actors) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('actor_list', { title: 'Actor List:', actor_list: list_actors });
    });
};

// Display detail page for a specific actor.
exports.actor_detail = function(req, res) {
    async.parallel({
        actor: function(callback) {
            Actor.findById(req.params.id)
              .exec(callback)
        },
        actor_films: function(callback) {
          Film.find({ 'starring': req.params.id },'title summary image_url')
          .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage.
        if (results.actor==null) { // No results.
            var err = new Error('Actor not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('actor_detail', { title: results.actor.name , actor: results.actor, actor_films: results.actor_films } );
    });
};

// Display actor create form on GET.
exports.actor_create_get = function(req, res) {
    res.render('actor_form', { title: 'Add New Actor'});
};

// Handle actor create on POST.
exports.actor_create_post = [

    // Validate and sanitize fields.
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('surname').trim().isLength({ min: 1 }).escape().withMessage('Surname must be specified.')
        .isString('Surname has non-alphanumeric characters.'),
    body('image_url').trim().isLength({ min: 1 }).withMessage('Image Url must be specified.')
        .isURL({ protocols: ['https'] }).withMessage('Image Url must be a valid Url'),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('actor_form', { title: 'Add New Actor', actor: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.
            Actor.findOne({ 'name': req.body.name , 'surname': req.body.surname })
                .exec( function(err, found_actor) {
                    if (err) { return next(err); }
        
                    if (found_actor) {
                    // Genre exists, redirect to its detail page.
                    res.redirect(found_actor.url);
                    }
                    else {
                        // Create an Actor object with escaped and trimmed data.
                        var actor = new Actor(
                            {
                                first_name: req.body.first_name,
                                surname: req.body.surname,
                                image_url: req.body.image_url
                            });
                        actor.save(function (err) {
                            if (err) { return next(err); }
                            // Successful - redirect to new actor record.
                            res.redirect(actor.url);
                        });
                    }
                })
        }
    }
];

// Display actor delete form on GET.
exports.actor_delete_get = function(req, res) {
    async.parallel({
        actor: function(callback) {
            Actor.findById(req.params.id).exec(callback)
        },
        actors_films: function(callback) {
            Film.find({ 'starring': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.actor==null) { // No results.
            res.redirect('/catalog/actors');
        }
        // Successful, so render.
        res.render('actor_delete', { title: 'Delete actor', actor: results.actor, actor_films: results.actors_films } );
    });
};

// Handle actor delete on POST.
exports.actor_delete_post = function(req, res) {
    async.parallel({
        actor: function(callback) {
          Actor.findById(req.body.actorid).exec(callback)
        },
        actors_films: function(callback) {
          Film.find({ 'starring': req.body.actorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.actors_films.length > 0) {
            // actor has movies. Render in same way as for GET route.
            res.render('actor_delete', { title: 'Delete actor', actor: results.actor, actor_films: results.actors_films } );
            return;
        }
        else {
            // actor has no films. Delete object and redirect to the list of actors.
            Actor.findByIdAndRemove(req.body.actorid, function deleteactor(err) {
                if (err) { return next(err); }
                // Success - go to actor list
                res.redirect('/catalog/actors')
            })
        }
    });
};

// Display actor update form on GET.
exports.actor_update_get = function(req, res) {
    // Get actor for form.
    async.parallel({
        actor: function(callback) {
            Actor.findById(req.params.id).exec(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.actor==null) { // No results.
                var err = new Error('Actor not found');
                err.status = 404;
                return next(err);
            }
            // Success.
            res.render('actor_form', { title: 'Update Actor', actor: results.actor });
        });
};

// Handle actor update on POST.
exports.actor_update_post = [

    // Validate and sanitize fields.
    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('surname').trim().isLength({ min: 1 }).escape().withMessage('Surname must be specified.')
        .isString('Surname has non-alphanumeric characters.'),
    body('image_url').trim().isLength({ min: 1 }).withMessage('Image Url must be specified.')
        .isURL({ protocols: ['https'] }).withMessage('Image Url must be a valid Url'),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('actor_form', { title: 'Update Actor', actor: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.
            // Create an Actor object with escaped and trimmed data.
            var actor = new Actor(
                {
                    first_name: req.body.first_name,
                    surname: req.body.surname,
                    image_url: req.body.image_url,
                    _id:req.params.id
                });
            Actor.findByIdAndUpdate(req.params.id, actor, {}, function (err,theActor) {
            if (err) { return next(err); }
                // Successful - redirect to actor detail page.
                res.redirect(theActor.url);
            });
        }
    }
];