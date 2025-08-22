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

const maskedUri = process.env.MONGO_URI ? process.env.MONGO_URI.replace(/(:\/\/)([^:]+):([^@]+)@/, '$1$2:*****@') : 'MONGO_URI not set';

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