const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const QRCoupon = require('../models/QRCoupon');
const { upload } = require('../utils/cloudinary');

router.post('/submit', upload.single('qrImage'), async (req, res) => {
    const {
        name,
        mobile,
        accountType,
        accountValue,
        accountNumber,
        ifsc,
        bankName,
        uniqueCode
    } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'QR Code image is mandatory' });
    }

    try {
        const coupon = await QRCoupon.findOne({ uniqueCode });
        if (!coupon) {
            return res.status(404).json({ message: 'Invalid QR Code' });
        }

        if (coupon.isUsed) {
            return res.status(400).json({ message: 'This QR code has already been used.' });
        }

        const newSubmission = new Submission({
            qrId: coupon._id,
            name,
            mobile,
            accountType,
            accountValue,
            accountNumber,
            ifsc,
            bankName,
            qrImageUrl: req.file.path,
        });

        await newSubmission.save();

        // Mark coupon as used
        coupon.isUsed = true;
        await coupon.save();

        res.status(201).json({
            message: 'Thank You! Your reward has been successfully submitted. The amount will be credited within 2–3 working days.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during submission' });
    }
});

module.exports = router;
