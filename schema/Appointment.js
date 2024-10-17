const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  name: String,
  contact: String,
  doctor: String,
  // date: { type: Date, required: true },
  time: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model("Appointment", appointmentSchema);

