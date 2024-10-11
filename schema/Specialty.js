// models/Specialty.js
const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema({
  name: String, // e.g., "Cardiology", "Orthopedics"
  keywords: [String], // e.g., ["heart", "cardiac"] for Cardiology
});

module.exports = mongoose.model('Specialty', specialtySchema);
