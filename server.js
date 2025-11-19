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
// Note: Ensure MONGO_URI is set in your environment variables (e.g., .env file)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Sensor Data Schema
const sensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  pressure: Number,
  light: Number,
  co2: Number,
  // Add an identifier to distinguish between ESP32 and ESP8266, 
  // although the ESP32 provides all fields and ESP8266 provides only CO2.
  deviceId: { type: String, required: false },
  timestamp: { type: Date, default: Date.now },
});

const SensorData = mongoose.model("SensorData", sensorSchema);

// ✅ POST Endpoint for ESP Devices
// The ESP8266 is only sending 'co2', while the ESP32 sends all.
app.post("/api/upload", async (req, res) => {
  try {
    // Extract fields. Mongoose will automatically handle missing fields (like temperature for ESP8266).
    const { temperature, humidity, pressure, light, co2, deviceId } = req.body;
    
    // Create new data document
    const newData = new SensorData({ temperature, humidity, pressure, light, co2, deviceId });
    await newData.save();

    console.log("📩 Data received:", req.body);
    res.status(200).json({ message: "✅ Data saved successfully" });
  } catch (err) {
    console.error("❌ Error saving data:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET Endpoint to View Data (for dashboard)
// Returns the latest 10 records for charting and display
app.get("/api/data", async (req, res) => {
  try {
    // Sort by timestamp descending (-1) to get the newest first
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(20); // Increase limit for better charting
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));