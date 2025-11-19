const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------- MONGO ATLAS CONNECTION ---------------------
const MONGO_URL = "mongodb+srv://IOT-ECO:3vTb7J31w9qH9Fy0@ecochain.cmxatdi.mongodb.net/iot_data?retryWrites=true&w=majority";

mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Atlas Connected"))
.catch(err => console.log("DB Error:", err));

// --------------------- SCHEMA ---------------------
const SensorSchema = new mongoose.Schema({
    device: String,      // esp8266 or esp32
    location: String,    // indoor or outdoor
    co2: Number,
    temperature: Number,
    humidity: Number,
    pressure: Number,
    light: Number,
    time: String,        // RTC time
    createdAt: { type: Date, default: Date.now }
});

const Sensor = mongoose.model("Sensor", SensorSchema);

// --------------------- ROUTES ---------------------

// ESP8266 → INDOOR
app.post("/esp8266", async (req, res) => {
    try {
        const { co2, time } = req.body;

        const entry = new Sensor({
            device: "esp8266",
            location: "indoor",
            co2,
            time
        });

        await entry.save();
        res.status(200).json({ message: "Indoor (ESP8266) data stored" });

    } catch (err) {
        res.status(400).json({ error: "Error saving ESP8266 data" });
    }
});

// ESP32 → OUTDOOR
app.post("/esp32", async (req, res) => {
    try {
        const { co2, time, temperature, humidity, pressure, light } = req.body;

        const entry = new Sensor({
            device: "esp32",
            location: "outdoor",
            co2,
            temperature,
            humidity,
            pressure,
            light,
            time
        });

        await entry.save();
        res.status(200).json({ message: "Outdoor (ESP32) data stored" });

    } catch (err) {
        res.status(400).json({ error: "Error saving ESP32 data" });
    }
});

// Get ALL data
app.get("/all", async (req, res) => {
    const all = await Sensor.find().sort({ createdAt: -1 });
    res.json(all);
});

// --------------------- START SERVER ---------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
