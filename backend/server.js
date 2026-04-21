const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

const { MongoMemoryServer } = require('mongodb-memory-server');

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to MongoDB');
        createAdmin();
    } catch (err) {
        console.log('Local MongoDB not found. Starting Memory Server for testing...');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log('Connected to In-Memory MongoDB');
        createAdmin();
    }
};

connectDB();

// Admin creation helper
const Admin = require('./models/Admin');
const createAdmin = async () => {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
        const admin = new Admin({
            username: 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123'
        });
        await admin.save();
        console.log('Default admin created: admin /', process.env.ADMIN_PASSWORD || 'admin123');
    }
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/submit', require('./routes/submissionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
