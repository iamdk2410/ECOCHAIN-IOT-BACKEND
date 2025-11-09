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

// ✅ Sensor Data Schema
const sensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  pressure: Number,
  light: Number,
  co2: Number,
  timestamp: { type: Date, default: Date.now },
});

const SensorData = mongoose.model("SensorData", sensorSchema);

// ✅ POST Endpoint for ESP32
app.post("/api/upload", async (req, res) => {
  try {
    const { temperature, humidity, pressure, light, co2 } = req.body;
    const newData = new SensorData({ temperature, humidity, pressure, light, co2 });
    await newData.save();

    console.log("📩 Data received:", req.body);
    res.status(200).json({ message: "✅ Data saved successfully" });
  } catch (err) {
    console.error("❌ Error saving data:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET Endpoint to View Data (for debugging)
app.get("/api/data", async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(10);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
