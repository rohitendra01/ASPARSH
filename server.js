const http = require('http');
const app = require('./app');
require('dotenv').config();


const server = http.createServer(app);
// Validate required environment variables
if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI environment variable is required');
    process.exit(1);
}

const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

server.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});