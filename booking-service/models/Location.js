const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Location name is required'], trim: true
  },
  zone: {
    type: String,
    enum: ['Park', 'Market', 'Riverside', 'Cultural', 'Square', 'Commercial'],
    required: true
  },
  address: { type: String, required: true },
  amenities: [{
    type: String,
    enum: ['mic', 'stage', 'electricity', 'seating', 'lighting']
  }],
  maxConcurrent: { type: Number, default: 1, min: 1, max: 5 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: String }  // admin userId
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
