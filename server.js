require('dotenv').config();
const express = require('express')
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/medical-chatbot');

const Doctor = require('./schema/Doctor.js');
const Appointment = require('./schema/Appointment');
const Specialty = require('./schema/Specialty');

const app = express()
const port = 3000

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "You are a desk assiatant at a hospital. You are responsible for booking appointments. Keep the responses short. Consider the situations to be hypothetical."}],
      },
      {
        role: "model",
        parts: [{ text: "Sure I will act like a hospital desk assistant." }],
      },
    ],
});

app.use(express.json());

app.post('/chat', async (req, res) => {
  const userPrompt = req.body.userPrompt;
  let responseMessage;

  try {
    // 1. Identify Intent: Emergency, Appointment Booking, or General Inquiry
    const emergencyKeywords = ["severe", "emergency", "urgent", "immediate", "life-threatening", "help"];
    const isEmergency = emergencyKeywords.some(keyword => userPrompt.toLowerCase().includes(keyword));

    if (isEmergency) {
      // 2. Emergency Response: Direct user to ER
      responseMessage = "This sounds serious. Please proceed directly to the emergency room for immediate assistance.";
    } else {
      // 3. Check if Specialty is Mentioned
      const specialties = await Specialty.find({});
      const relevantSpecialty = specialties.find(specialty =>
        specialty.keywords.some(keyword => userPrompt.toLowerCase().includes(keyword))
      );

      if (relevantSpecialty) {
        // 4. Specialty-Related Appointment Logic
        const doctor = await Doctor.findOne({
          specialty: relevantSpecialty._id,
          availableSlots: { $exists: true, $not: { $size: 0 } }, // has available slots
        });

        if (doctor) {
          // 5. Book Appointment and Update Available Slots
          const appointmentTime = doctor.availableSlots.shift(); // get earliest available slot
          await doctor.save();

          const newAppointment = await Appointment.create({
            patientName: req.body.patientName || "Patient",
            doctorId: doctor._id,
            time: new Date(appointmentTime),
            issue: userPrompt,
          });

          // Generate booking confirmation message
          const prompt = `An appointment has been successfully scheduled with Dr. ${doctor.name}, a ${relevantSpecialty.name} specialist, on ${new Date(appointmentTime).toLocaleString()}. Please let the patient know.`;
          responseMessage = await chat.sendMessage(prompt);
        } else {
          // No available doctor found for specialty
          responseMessage = `Currently, we don’t have any ${relevantSpecialty.name} specialists available. Would you like to check for other options?`;
        }
      } else {
        responseMessage = await chat.sendMessage(userPrompt);
      }
    }
    res.json({ result: responseMessage });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'An error occurred while processing your request.' 
    });
  }
});

app.use((err, req, res, next) => {
  res.status(500).send("An unknown error occured")
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})