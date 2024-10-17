//imports
require('dotenv').config();
const express = require('express')
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const Appointment = require("./schema/Appointment.js")

//mongoose
mongoose.connect(process.env.MONGO_DB_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("MongoDB connection error:", error);
});

//express
const app = express()
const port = 3000

//gemini config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: `You are a desk assistant at a hospital. 
          You are responsible for booking appointments. 
          Consider the situations to be hypothetical. 
          Keep the responses short.
          There should be no responses like 'wait for moment', 'Okay, let me check for availability' etc..
          Ask for name, contact and time when booking appointment.
          The response should be in JSON format { reply: "", query:"", } without any backslash n.
          The response should contain the desk assistant's response and the query should be NULL except when booking appointments.
          When you book an appointment make the query a JSON { name, contact, doctor, time } without any backslash n.`}],
      },
      {
        role: "model",
        parts: [{ text: "Sure I will act like a hospital desk assistant with the given instructions." }],
      },
    ],
});

app.use(express.json());

app.post('/chat', async (req, res) => {
  const userPrompt = req.body.userPrompt;
  let result = await chat.sendMessage(userPrompt);
  let response = result.response.candidates[0]?.content?.parts[0]?.text;
  const obj = JSON.parse(response);
  if (obj.query != null) {
    try {
      const newAppointment = new Appointment({
        name: obj.query.name,
        contact: obj.query.contact,
        doctor: obj.query.doctor,
        // date: obj.query.date,
        time: obj.query.time,
      });
      
      await newAppointment.save();
    } catch (error) {
      console.error("Error saving appointment:", error);
      return res.status(500).json({ message: "Error saving appointment." });
    }
  }
  res.status(200).json({
    obj,
  })
})

app.use('/', (err, res, req, next) => {
  console.error(`Error: ${err}`);
  res.send("An internal error occured.");
  next();
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})