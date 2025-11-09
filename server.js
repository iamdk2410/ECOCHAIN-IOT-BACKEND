import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const SensorData = mongoose.model("SensorData", new mongoose.Schema({
  co2: Number,
  temperature: Number,
  humidity: Number,
  pressure: Number,
  light: Number,
  time: String,
  date: String,
  timestamp: { type: Date, default: Date.now },
}));

// POST route to receive data from ESP32
app.post("/api/data", async (req, res) => {
  try {
    const data = new SensorData(req.body);
    await data.save();
    console.log("✅ Data saved:", req.body);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET route to see all data
app.get("/api/data", async (req, res) => {
  const data = await SensorData.find().sort({ timestamp: -1 });
  res.json(data);
});

app.listen(3000, () => console.log("🌍 Server running on port 3000"));
