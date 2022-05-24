#! /usr/bin/env node

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
var async = require('async')
var Film = require('./models/film')
var Director = require('./models/director')
var Genre = require('./models/genre')
var Actor = require('./models/actor')


var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var films = []
var genres = []
var directors = []
var actors = []

function directorCreate(first_name, surname, d_birth, d_death, image_url, cb) {
  directorDetail = {first_name:first_name , surname: surname , image_url: image_url}
  if (d_birth != false) directorDetail.date_of_birth = d_birth
  if (d_death != false) directorDetail.date_of_death = d_death
  
  var dir = new Director(directorDetail);
       
  dir.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New Director: ' + dir);
    directors.push(dir)
    cb(null, dir)
  }  );
}

function actorCreate(first_name, surname, image_url, cb) {
    actorDetail = {first_name:first_name , surname: surname , image_url: image_url}
    
    var act = new Actor(actorDetail);
         
    act.save(function (err) {
      if (err) {
        cb(err, null)
        return
      }
      console.log('New Actor: ' + act);
      actors.push(act)
      cb(null, act)
    }  );
  }

function genreCreate(name, cb) {
  var genre = new Genre({ name: name });
       
  genre.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log('New Genre: ' + genre);
    genres.push(genre)
    cb(null, genre);
  }   );
}

function filmCreate(title, summary, actor, director, genre, realese_date,image_url, cb) {
  filmDetail = { 
    title: title,
    summary: summary,
    director: director,
    starring: actor,
    realese_date: realese_date,
    image_url: image_url
  }
  if (genre != false) filmDetail.genre = genre
    
  var theFilm = new Film(filmDetail);    
  theFilm.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New Film: ' + theFilm);
    films.push(theFilm)
    cb(null, theFilm)
  }  );
}

function createGenreDirectorActor(cb) {
    async.series([
        function(callback) {
          directorCreate('Francis', 'Ford Coppola', '1939-04-07', false, 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Francis_Ford_Coppola_-1976.jpg', callback);
        },
        function(callback) {
            directorCreate('Quentin', 'Tarantino', '1963-03-27', false, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Quentin_Tarantino_by_Gage_Skidmore.jpg/1200px-Quentin_Tarantino_by_Gage_Skidmore.jpg', callback);
        },
        function(callback) {
            directorCreate('Lana', 'Wachowski', '1965-06-21', false, 'https://www.repstatic.it/content/nazionale/img/2019/08/21/113019108-a3fc0ba5-84c6-482a-b506-a821f8d61dc1.jpg', callback);
        },
        function(callback) {
          directorCreate('Lilly', 'Wachowski', '1967-12-29', false, 'https://biografieonline.it/img/bio/l/Lilly_Wachowski.jpg', callback);
        },
        function(callback) {
          directorCreate('Chad', 'Stahelski', '1968-09-20', false, 'https://static.wikia.nocookie.net/thecrow/images/e/e5/684C6FDF-2E4A-4C30-87BD-6CC6CB34FB47.jpeg/revision/latest?cb=20190727143127', callback);
        },
        function(callback) {
          actorCreate('Keanu', 'Reeves', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Reuni%C3%A3o_com_o_ator_norte-americano_Keanu_Reeves_cropped_2_%2846806576944%29_%28cropped%29.jpg/1200px-Reuni%C3%A3o_com_o_ator_norte-americano_Keanu_Reeves_cropped_2_%2846806576944%29_%28cropped%29.jpg', callback);
        },
        function(callback) {
          actorCreate('Laurence', 'Fishburne', 'https://upload.wikimedia.org/wikipedia/commons/0/05/Laurence_Fishburne_2009_-_cropped.jpg', callback);
        },
        function(callback) {
          actorCreate('Marlon', 'Brando', 'http://t3.gstatic.com/licensed-image?q=tbn:ANd9GcRcft2nemmiOeIlZzg01QDxOH1Axa1F51ORAQGS_QwpiPHc5xMo7wftL4itMOAy', callback);
        },
        function(callback) {
          actorCreate('Al', 'Pacino', 'https://mr.comingsoon.it/imgdb/persone/79573_ico.jpg', callback);
        },
        function(callback) {
          actorCreate('John', 'Travolta', 'https://upload.wikimedia.org/wikipedia/commons/1/15/John_Travolta_deauville.jpg', callback);
        },
        function(callback) {
          actorCreate('Uma', 'Thurman', 'https://biografieonline.it/img/bio/u/Uma_Thurman.jpg', callback);
        },
        function(callback) {
          actorCreate('Samuel', 'L. Jackson', 'https://nientepopcorn.b-cdn.net/persone-img/big/samuel-l-jackson-2231.jpg', callback);
        },
        function(callback) {
          actorCreate('Robert', 'De Niro', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Robert_De_Niro_KVIFF_portrait.jpg/640px-Robert_De_Niro_KVIFF_portrait.jpg', callback);
        },
        function(callback) {
          actorCreate('Kurt', 'Russel', 'http://www.celluloidportraits.com/img/Registiattori/imgREGISTIeATTORI15/Kurt%20Russell%201_1619_L.jpg', callback);
        },
        function(callback) {
          genreCreate("Fantasy", callback);
        },
        function(callback) {
          genreCreate("Crime", callback);
        },
        function(callback) {
          genreCreate("Drama", callback);
        },
        function(callback) {
          genreCreate("Action", callback);
        },
        function(callback) {
          genreCreate("Sci-Fi", callback);
        },
        ],
        // optional callback
        cb);
}


function createFilms(cb) {
    async.parallel([
        function(callback) {
          filmCreate('The Hateful Eight', 'In the dead of a Wyoming winter, a bounty hunter and his prisoner find shelter in a cabin currently inhabited by a collection of nefarious characters.', [actors[6],actors[8],], [directors[1],], [genres[1],genres[2],],'2016-01-28','https://mr.comingsoon.it/imgdb/locandine/big/50763.jpg', callback);
        },
        function(callback) {
          filmCreate('Pulp Fiction', 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', [actors[6],actors[5],actors[4],], [directors[1],], [genres[1],genres[2],],'1994-10-28','https://mr.comingsoon.it/imgdb/locandine/big/1182.jpg', callback);
        },
        function(callback) {
          filmCreate('The Godfather', 'The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.', [actors[2],actors[3],], [directors[0],], [genres[1],genres[2],],'1972-09-21','https://pad.mymovies.it/filmclub/2002/08/056/locandina.jpg', callback);
        },
        function(callback) {
          filmCreate('The Godfather: Part II', 'The early life and career of Vito Corleone in 1920s New York City is portrayed, while his son, Michael, expands and tightens his grip on the family crime syndicate.', [actors[7],actors[3],], [directors[0],], [genres[1],genres[2],],'1975-06-20','https://mr.comingsoon.it/imgdb/locandine/big/16187.jpg', callback);
        },
        function(callback) {
          filmCreate('The Matrix', 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.', [actors[0],actors[1],], [directors[2],directors[3],], [genres[3],genres[4],],'1999-05-07','https://mr.comingsoon.it/imgdb/locandine/big/1111.jpg', callback);
        },
        function(callback) {
          filmCreate('Matrix Reloaded', 'Freedom fighters Neo, Trinity and Morpheus continue to lead the revolt against the Machine Army, unleashing their arsenal of extraordinary skills and weaponry against the systematic forces of repression and exploitation.', [actors[0],actors[1],], [directors[2],directors[3],], [genres[3],genres[4],],'2003-05-16','https://pad.mymovies.it/filmclub/2003/05/013/locandina.jpg', callback);
        },
        function(callback) {
          filmCreate('John Wick', 'An ex-hit-man comes out of retirement to track down the gangsters that killed his dog and took everything from him.', [actors[0],], [directors[4],], [genres[3],genres[1],],'2015-01-22','https://aforismi.meglio.it/img/film/John_Wick.jpg', callback);
        },
        ],
        // optional callback
        cb);
}

async.series([
    createGenreDirectorActor,
    createFilms
],
// Optional callback
function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    else {
        console.log('Films: '+films);
        
    }
    // All done, disconnect from database
    mongoose.connection.close();
});
