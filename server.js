// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- 1. OUTDOOR MODEL (ESP32: Full Sensors) ---
const outdoorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  pressure: Number,
  light: Number,
  co2: { type: Number, required: true }, // CO2 is required for this model
  timestamp: { type: Date, default: Date.now },
});
const OutdoorData = mongoose.model("OutdoorData", outdoorSchema);

// --- 2. INDOOR MODEL (ESP8266: CO2 Only) ---
const indoorSchema = new mongoose.Schema({
  co2: { type: Number, required: true }, // CO2 is required for this model
  timestamp: { type: Date, default: Date.now },
});
const IndoorData = mongoose.model("IndoorData", indoorSchema);

// --- POST Endpoint for ESP32 (Outdoor) ---
app.post("/api/upload", async (req, res) => {
  try {
    const { temperature, humidity, pressure, light, co2 } = req.body;
    
    // **FIX: Explicit validation for required fields**
    if (co2 === undefined || co2 === null) {
        return res.status(400).json({ error: "Bad Request: 'co2' field is required for Outdoor upload." });
    }
    
    // Save to the dedicated OutdoorData model
    const newData = new OutdoorData({ temperature, humidity, pressure, light, co2 });
    await newData.save();

    console.log("📩 Outdoor Data received:", req.body);
    res.status(200).json({ message: "✅ Outdoor Data saved successfully" });
  } catch (err) {
    console.error("❌ Error saving Outdoor data:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- NEW POST Endpoint for ESP8266 (Indoor) ---
app.post("/api/upload/indoor", async (req, res) => {
  try {
    const { co2 } = req.body;
    
    // **FIX: Explicit validation for required field**
    if (co2 === undefined || co2 === null) {
        return res.status(400).json({ error: "Bad Request: 'co2' field is required for Indoor upload." });
    }
    
    // Save to the dedicated IndoorData model
    const newData = new IndoorData({ co2 });
    await newData.save();

    console.log("📩 Indoor Data received:", req.body);
    res.status(200).json({ message: "✅ Indoor Data saved successfully" });
  } catch (err) {
    console.error("❌ Error saving Indoor data:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET Endpoint to View Latest Data (for Live Dashboard)
app.get("/api/data/latest", async (req, res) => {
  try {
    const latestOutdoor = await OutdoorData.findOne().sort({ timestamp: -1 });
    const latestIndoor = await IndoorData.findOne().sort({ timestamp: -1 });

    const combinedLatest = {
      outdoor: latestOutdoor,
      indoor: latestIndoor
    };

    res.json(combinedLatest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET Endpoint to View History Data (for History Table)
app.get("/api/data/history", async (req, res) => {
  try {
    // Fetch recent data from both models (limit to 20 each for a total of 40)
    const outdoorHistory = await OutdoorData.find().sort({ timestamp: -1 }).limit(20);
    const indoorHistory = await IndoorData.find().sort({ timestamp: -1 }).limit(20);
    
    // Combine both arrays and return them (frontend will handle sorting and display)
    const combinedHistory = [...outdoorHistory.map(d => ({ ...d._doc, model: 'outdoor' })), 
                             ...indoorHistory.map(d => ({ ...d._doc, model: 'indoor' }))];
                             
    res.json(combinedHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));