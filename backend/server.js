const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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
        await seedData();
    }
}

// Seed data helper
const QRCoupon = require('./models/QRCoupon');
const Submission = require('./models/Submission');
const crypto = require('crypto');

const seedData = async () => {
    const qrCount = await QRCoupon.countDocuments();
    if (qrCount === 0) {
        console.log('Seeding sample data...');
        const coupons = await QRCoupon.insertMany([
            { uniqueCode: crypto.randomBytes(4).toString('hex').toUpperCase(), value: 50, isUsed: true },
            { uniqueCode: crypto.randomBytes(4).toString('hex').toUpperCase(), value: 100, isUsed: true },
            { uniqueCode: crypto.randomBytes(4).toString('hex').toUpperCase(), value: 50, isUsed: false },
            { uniqueCode: crypto.randomBytes(4).toString('hex').toUpperCase(), value: 200, isUsed: false }
        ]);

        await Submission.insertMany([
            {
                qrId: coupons[0]._id,
                name: 'Gaurav Kaushik',
                mobile: '9876543210',
                accountType: 'UPI_ID',
                accountValue: 'gaurav@upi',
                status: 'paid'
            },
            {
                qrId: coupons[1]._id,
                name: 'Aditi Sharma',
                mobile: '9123456789',
                accountType: 'AccountNumber',
                bankName: 'HDFC Bank',
                accountNumber: '50100123456789',
                ifsc: 'HDFC0001234',
                status: 'pending'
            }
        ]);
        console.log('Sample data seeded successfully.');
    }
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/submit', require('./routes/submissionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
