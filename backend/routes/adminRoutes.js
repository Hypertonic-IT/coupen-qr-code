const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const QRCoupon = require('../models/QRCoupon');
const auth = require('../middleware/auth');
const Admin = require('../models/Admin');

// Get all submissions with QR details
router.get('/submissions', auth, async (req, res) => {
    try {
        const submissions = await Submission.find().populate({
            path: 'qrId',
            select: 'uniqueCode value'
        }).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single submission with QR details
router.get('/submissions/:id', auth, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id).populate('qrId');
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.json(submission);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update submission status
router.patch('/update-status', auth, async (req, res) => {
    const { submissionId, status } = req.body;
    try {
        const submission = await Submission.findByIdAndUpdate(
            submissionId,
            { status },
            { new: true }
        );
        res.json(submission);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Stats
router.get('/stats', auth, async (req, res) => {
    try {
        const totalQR = await QRCoupon.countDocuments();
        const usedQR = await QRCoupon.countDocuments({ isUsed: true });
        const unusedQR = totalQR - usedQR;

        // Sum of values of used coupons
        const usedCoupons = await QRCoupon.find({ isUsed: true });
        const totalValue = usedCoupons.reduce((acc, curr) => acc + curr.value, 0);

        res.json({
            totalQR,
            usedQR,
            unusedQR,
            totalValue
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Export to CSV (Simple implementation)
router.get('/export', auth, async (req, res) => {
    try {
        const submissions = await Submission.find().populate('qrId');
        let csv = 'Name,Mobile,Account Type,Account Value,Status,QR ID,Value,Date\n';

        submissions.forEach(s => {
            csv += `${s.name},${s.mobile},${s.accountType},${s.accountValue},${s.status},${s.qrId?.uniqueCode || 'N/A'},${s.qrId?.value || 0},${s.createdAt}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=submissions.csv');
        res.status(200).send(csv);
    } catch (err) {
        res.status(500).json({ message: 'Export failed' });
    }
});

// Update Admin Profile (Username/Password)
router.patch('/profile', auth, async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findById(req.adminId);
        // Admin existence is guaranteed by auth middleware, but we'll keep a simple check
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        if (username) admin.username = username;
        if (password) admin.password = password;

        await admin.save();
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
