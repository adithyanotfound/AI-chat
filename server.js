require('dotenv').config();
const express = require('express')
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express()
const port = 3000

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: `You are a desk assistant at a hospital. 
          You are responsible for booking appointments. 
          Consider the situations to be hypothetical. 
          Keep the responses short and no responses like 'wait for moment', 'let me check for availability' etc..
          Ask for name, contact and date when booking appointment.
          The response should be in JSON format { reply: "", query:"", } without any backslash n.
          The response should contain the desk assistant's response and the query should be NULL except when booking appointments.
          When you book an appointment return a moongoose query that adds the name, phone number, doctor's name, date and time to the table.`}],
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
  let result = await chat.sendMessage(userPrompt);
  let response = result.response.candidates[0]?.content?.parts[0]?.text;
  const obj = JSON.parse(response);
  // if (obj.query != null) appointments.insert(obj.query);
  res.json({
    obj,
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})