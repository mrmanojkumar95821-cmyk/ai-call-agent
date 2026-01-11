import express from "express";
import twilio from "twilio";

const app = express();
app.use(express.urlencoded({ extended: false }));

const VoiceResponse = twilio.twiml.VoiceResponse;

// Test route
app.get("/", (req, res) => {
  res.send("AI Call Agent is running ✅");
});

// Incoming call
app.post("/voice", (req, res) => {
  const twiml = new VoiceResponse();

  twiml.say("Hello! This is your AI assistant. Please speak after the beep.");

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

// Process speech
app.post("/process", (req, res) => {
  const userSpeech = req.body.SpeechResult || "I did not hear anything.";

  const twiml = new VoiceResponse();
  twiml.say("You said " + userSpeech);

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
