import express from "express";
import axios from "axios";
import twilio from "twilio";

const app = express();
app.use(express.urlencoded({ extended: false }));

// Twilio webhook
app.post("/voice", async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say("Hello! Welcome to our AI assistant. Please tell me your requirement after the beep.");
  twiml.record({
    maxLength: 10,
    action: "/process"
  });

  res.type("text/xml");
  res.send(twiml.toString());
});

// Process recording
app.post("/process", async (req, res) => {
  const recordingUrl = req.body.RecordingUrl;

  // TODO:
  // 1. Send audio to Speech-to-Text
  // 2. Send text to Groq AI
  // 3. Convert reply to voice
  // 4. Respond back

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Thank you. Our team will contact you shortly.");
  res.type("text/xml");
  res.send(twiml.toString());
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
