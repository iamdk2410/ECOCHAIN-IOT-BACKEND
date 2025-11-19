const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --------------------- DATABASE CONNECTION ---------------------
mongoose.connect("mongodb://localhost:27017/iot_data", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("DB Error:", err));

// --------------------- SCHEMA ---------------------
const SensorSchema = new mongoose.Schema({
    device: String,      // esp8266 OR esp32
    co2: Number,
    timestamp: String
});

const Sensor = mongoose.model("Sensor", SensorSchema);

// --------------------- ROUTES ---------------------

// ESP8266 route
app.post("/esp8266", async (req, res) => {
    try {
        const { co2, timestamp } = req.body;

        const entry = new Sensor({
            device: "esp8266",
            co2,
            timestamp
        });

        await entry.save();

        res.status(200).send("ESP8266 data stored");
    } catch (error) {
        res.status(400).send("Error saving data");
    }
});

// ESP32 route
app.post("/esp32", async (req, res) => {
    try {
        const { co2, timestamp } = req.body;

        const entry = new Sensor({
            device: "esp32",
            co2,
            timestamp
        });

        await entry.save();

        res.status(200).send("ESP32 data stored");
    } catch (error) {
        res.status(400).send("Error saving data");
    }
});

// Get all stored data
app.get("/all", async (req, res) => {
    const all = await Sensor.find();
    res.json(all);
});

// --------------------- START SERVER ---------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
