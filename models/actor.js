var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ActorSchema = new Schema(
  {
    first_name: {type: String, required: true, maxLength: 100},
    surname: {type: String, required: true, maxLength: 100},
    image_url: {type: String, required: true},
  }
);

// Virtual for actor's full name
ActorSchema
.virtual('name')
.get(function () {
  var fullname = '';
  if (this.first_name && this.surname) {
    fullname = this.first_name + ', ' + this.surname
  }
  if (!this.first_name || !this.surname) {
    fullname = '';
  }
  return fullname;
});

// Virtual for actor's URL
ActorSchema
.virtual('url')
.get(function () {
  return '/catalog/actor/' + this._id;
});

//Export model
module.exports = mongoose.model('Actor', ActorSchema);