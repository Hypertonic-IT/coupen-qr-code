const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const QRCoupon = require('../models/QRCoupon');
const auth = require('../middleware/auth');

// Generate QR codes (Bulk or Single)
router.post('/generate', auth, async (req, res) => {
    const { count, value } = req.body;

    if (!count || !value) {
        return res.status(400).json({ message: 'Count and value are required' });
    }

    try {
        const coupons = [];
        for (let i = 0; i < count; i++) {
            coupons.push({
                uniqueCode: crypto.randomUUID(),
                value: value
            });
        }

        const savedCoupons = await QRCoupon.insertMany(coupons);
        res.status(201).json(savedCoupons);
    } catch (err) {
        res.status(500).json({ message: 'Server error during QR generation' });
    }
});

// Fetch QR details by uniqueCode
router.get('/:id', async (req, res) => {
    try {
        const coupon = await QRCoupon.findOne({ uniqueCode: req.params.id });
        if (!coupon) {
            return res.status(404).json({ message: 'QR Code not found' });
        }
        res.json(coupon);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all QR codes
router.get('/', auth, async (req, res) => {
    try {
        const coupons = await QRCoupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

const archiver = require('archiver');
const QRCode = require('qrcode');

// Download all QR codes as ZIP
router.get('/download-zip', auth, async (req, res) => {
    try {
        const coupons = await QRCoupon.find();

        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment('qr-codes.zip');
        archive.pipe(res);

        for (const coupon of coupons) {
            const url = `${process.env.FRONTEND_URL}/coupon/${coupon.uniqueCode}`;
            const qrBuffer = await QRCode.toBuffer(url);
            archive.append(qrBuffer, { name: `qr-${coupon.uniqueCode}.png` });
        }

        archive.finalize();
    } catch (err) {
        res.status(500).json({ message: 'ZIP generation failed' });
    }
});

module.exports = router;
