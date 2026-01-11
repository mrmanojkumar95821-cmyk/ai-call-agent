import express from "express";
import twilio from "twilio";
import axios from "axios";

const app = express();
app.use(express.urlencoded({ extended: false }));

const VoiceResponse = twilio.twiml.VoiceResponse;

// Simple memory for each call (demo purpose)
const sessions = {};

// -------------------
// AI Function (Groq)
// -------------------
async function askAI(callSid, userText) {
  if (!sessions[callSid]) {
    sessions[callSid] = [
      {
        role: "system",
        content: `
You are a professional business receptionist AI.
Your goals:
1. Greet the caller politely.
2. Ask their name.
3. Ask what service they want.
4. Ask if they want to book an appointment.
5. Keep replies short and friendly.
6. Never say you are an AI.
`
      }
    ];
  }

  sessions[callSid].push({
    role: "user",
    content: userText
  });

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama3-8b-8192",
      messages: sessions[callSid],
      temperature: 0.4
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const aiText = response.data.choices[0].message.content;

  sessions[callSid].push({
    role: "assistant",
    content: aiText
  });

  return aiText;
}

// -------------------
// Incoming Call
// -------------------
app.post("/voice", (req, res) => {
  const twiml = new VoiceResponse();

  twiml.say("Hello! Thanks for calling. Please tell me how I can help you.");

  twiml.gather({
    input: "speech",
    timeout: 5,
    speechTimeout: "auto",
    action: "/process",
    method: "POST"
  });

  res.type("text/xml");
  res.send(twiml.toString());
});

// -------------------
// Process Speech
// -------------------
app.post("/process", async (req, res) => {
  const callSid = req.body.CallSid;
  const userSpeech = req.body.SpeechResult || "";

  const twiml = new VoiceResponse();

  console.log("User said:", userSpeech);

  if (!userSpeech) {
    twiml.say("Sorry, I did not hear you. Please say that again.");
    twiml.redirect("/voice");
    res.type("text/xml");
    return res.send(twiml.toString());
  }

  try {
    const aiReply = await askAI(callSid, userSpeech);
    console.log("AI:", aiReply);

    twiml.say(aiReply);

    // Ask again (continue conversation)
    twiml.gather({
      input: "speech",
      timeout: 5,
      speechTimeout: "auto",
      action: "/process",
      method: "POST"
    });

  } catch (error) {
    console.error("AI error:", error.message);
    twiml.say("Sorry, something went wrong. Please try again later.");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

// -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
