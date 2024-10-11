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
  let result = await chat.sendMessage(userPrompt);
  res.json({
    result,
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})