const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  artistId:   { type: String, required: true },
  artistName: { type: String, required: true },
  artistGenre:{ type: String },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  date:       { type: String, required: true },   // YYYY-MM-DD
  startTime:  { type: String, required: true },   // HH:MM
  endTime:    { type: String, required: true },   // HH:MM
  artType: {
    type: String,
    enum: ['Music', 'Dance', 'Magic', 'Comedy', 'Acrobatics', 'Painting', 'Theater', 'Other'],
    required: true
  },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  permitNumber:    { type: String, default: null },
  rejectionReason: { type: String, default: null },
  approvedBy:      { type: String, default: null },
  approvedAt:      { type: Date, default: null }
}, { timestamps: true });

// Compound index for conflict detection
bookingSchema.index({ locationId: 1, date: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
