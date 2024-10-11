// models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientName: String,
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  time: Date,
  issue: String,
});

module.exports = mongoose.model('Appointment', appointmentSchema);
