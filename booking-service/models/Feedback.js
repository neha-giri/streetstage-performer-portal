const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  artistId:   { type: String, required: true },
  rating:     { type: Number, min: 1, max: 5, required: true },
  comment:    { type: String, maxlength: 500 }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
