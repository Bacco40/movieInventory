var mongoose = require('mongoose');
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var DirectorSchema = new Schema(
  {
    first_name: {type: String, required: true, maxLength: 100},
    surname: {type: String, required: true, maxLength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
    image_url: {type: String, required: true},
  }
);

// Virtual for director's full name
DirectorSchema
.virtual('name')
.get(function () {
  var fullname = '';
  if (this.first_name && this.surname) {
    fullname = this.first_name + ' ' + this.surname
  }
  if (!this.first_name || !this.surname) {
    fullname = '';
  }
  return fullname;
});

// Virtual for director's lifespan
DirectorSchema.virtual('lifespan').get(function() {
  var lifetime_string = '';
  if (this.date_of_birth) {
    lifetime_string = this.date_of_birth.getYear().toString();
  }
  lifetime_string += ' - ';
  if (this.date_of_death) {
    lifetime_string += this.date_of_death.getYear()
  }
  return lifetime_string;
});

// Virtual for director's URL
DirectorSchema
.virtual('url')
.get(function () {
  return '/catalog/director/' + this._id;
});

DirectorSchema
.virtual('form_update_date_of_birth')
.get(function (){
  return DateTime.fromJSDate(this.date_of_birth).toFormat('yyyy-MM-dd');
})

//Export model
module.exports = mongoose.model('Director', DirectorSchema);
