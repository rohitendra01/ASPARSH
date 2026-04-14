require('dotenv').config();
const http = require('http');
const app = require('./app');
const mongoose = require("mongoose");

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 50,
    socketTimeoutMS: 45000
}).then(() => {
    console.log("✅ Connected to MongoDB");
}).catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Prevents active user requests from crashing during server restarts/deployments
const gracefulShutdown = async (signal) => {

    server.close(async () => {
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection successfully closed.');
            process.exit(0);
        } catch (err) {
            console.error('Error closing MongoDB connection:', err);
            process.exit(1);
        }
    });

    setTimeout(() => {
        console.error('Forcing shutdown after 10s timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));