var mongoose = require('mongoose');
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var FilmSchema = new Schema(
  {
    title: {type: String, required: true},
    director: [{type: Schema.Types.ObjectId, ref: 'Director', required: true}],
    summary: {type: String, required: true},
    genre: [{type: Schema.Types.ObjectId, ref: 'Genre'}],
    release_date: {type: Date, required: true},
    image_url: {type: String, required: true},
    starring: [{type: Schema.Types.ObjectId, ref: 'Actor', required: true}],
  }
);

// Virtual for film's URL
FilmSchema
.virtual('url')
.get(function () {
  return '/catalog/film/' + this._id;
});

FilmSchema
.virtual('release_date_formatted')
.get(function () {
  return DateTime.fromJSDate(this.release_date).toLocaleString(DateTime.DATE_MED);
});

FilmSchema
.virtual('form_update_release_date')
.get(function (){
  return DateTime.fromJSDate(this.release_date).toFormat('yyyy-MM-dd');
})

//Export model
module.exports = mongoose.model('Film', FilmSchema);
