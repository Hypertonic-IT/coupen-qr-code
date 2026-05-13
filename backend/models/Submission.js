const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    qrId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QRCoupon',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        enum: ['AccountNumber', 'UPI_ID', 'UPI_Number'],
        required: true
    },
    // Generic field for single-value types (UPI ID, UPI Number)
    accountValue: {
        type: String
    },
    // Detailed fields for Bank Account
    accountNumber: { type: String },
    ifsc: { type: String },
    bankName: { type: String },

    qrImageUrl: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'paid'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Submission', submissionSchema);
