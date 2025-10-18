const http = require('http');
const app = require('./app');
const mongoose = require("mongoose");
require('dotenv').config();

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB connection error:", err && err.message ? err.message : err);
    console.error(err);
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});