const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const QRCoupon = require('../models/QRCoupon');
const auth = require('../middleware/auth');

const generateShortId = () => crypto.randomBytes(4).toString('hex').toUpperCase();

// Generate QR codes (Bulk or Single)
router.post('/generate', auth, async (req, res) => {
    const { count, value } = req.body;

    if (!count || !value) {
        return res.status(400).json({ message: 'Count and value are required' });
    }

    try {
        const batchId = `B-${Date.now()}`;
        const coupons = [];
        for (let i = 0; i < count; i++) {
            coupons.push({
                uniqueCode: generateShortId(),
                value: value,
                batchId: batchId
            });
        }

        const savedCoupons = await QRCoupon.insertMany(coupons);
        res.status(201).json({ coupons: savedCoupons, batchId });
    } catch (err) {
        console.error('QR Generation error:', err);
        res.status(500).json({ message: 'Server error during QR generation', error: err.message });
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

// Download QR codes as ZIP (All, limited, or specific IDs)
router.get('/download-zip', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.count) || 0;
        const ids = req.query.ids ? req.query.ids.split(',') : null;
        
        let query = QRCoupon.find().sort({ createdAt: -1 });
        
        if (ids) {
            query = QRCoupon.find({ _id: { $in: ids } });
        } else if (limit > 0) {
            query = query.limit(limit);
        }
        
        const coupons = await query;
        if (coupons.length === 0) return res.status(404).json({ message: 'No coupons found' });

        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment(`qr-codes-${Date.now()}.zip`);
        archive.pipe(res);

        for (const coupon of coupons) {
            const url = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/coupon/${coupon.uniqueCode}`;

            // Generate QR as base64 PNG data URL (scales perfectly inside SVG)
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 600,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' }
            });

            // ── Card dimensions ──────────────────────────────────────
            // Card: 420 × 660
            // Header: 110px  Footer: 140px
            // Available height for QR: 660 - 110 - 140 = 410px
            // QR: 340px (fits both width-wise with 40px margins AND height-wise)
            const W = 420, H = 660;
            const HEADER_H = 110;
            const FOOTER_H = 140;
            const PAD = 20;                           // padding around QR
            const QR_SIZE = 340;                      // fixed: fits both axes
            const QR_X = (W - QR_SIZE) / 2;          // centred horizontally = 40
            const QR_Y = HEADER_H + PAD;              // 130
            // Bottom of QR = 130 + 340 = 470, footer starts at 660-140 = 520 → 50px gap ✓

            const brandedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <!-- Gradients -->
    <linearGradient id="hdrG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#3730a3"/>
    </linearGradient>
    <linearGradient id="prizeG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
    <!-- Clip paths -->
    <clipPath id="cardClip"><rect width="${W}" height="${H}" rx="22"/></clipPath>
    <clipPath id="hdrClip" ><rect width="${W}" height="${HEADER_H}" rx="22"/></clipPath>
  </defs>

  <!-- ══ CARD BASE ═══════════════════════════════════════════════ -->
  <rect width="${W}" height="${H}" rx="22" fill="#ffffff" clip-path="url(#cardClip)"/>

  <!-- ══ HEADER ══════════════════════════════════════════════════ -->
  <rect width="${W}" height="${HEADER_H}" fill="url(#hdrG)" clip-path="url(#hdrClip)"/>
  <!-- Square off header bottom so it meets the tear-line cleanly -->
  <rect y="${HEADER_H - 22}" width="${W}" height="22" fill="#3730a3"/>

  <!-- Decorative circles in header -->
  <circle cx="${W - 10}" cy="-15" r="72" fill="rgba(255,255,255,0.04)"/>
  <circle cx="${W + 14}" cy="45"  r="44" fill="rgba(255,255,255,0.03)"/>

  <!-- Dot grid: top-right of header -->
  <circle cx="${W-70}" cy="24" r="3.5" fill="rgba(255,255,255,0.2)"/>
  <circle cx="${W-52}" cy="24" r="3.5" fill="rgba(255,255,255,0.13)"/>
  <circle cx="${W-70}" cy="43" r="3.5" fill="rgba(255,255,255,0.13)"/>
  <circle cx="${W-52}" cy="43" r="3.5" fill="rgba(255,255,255,0.2)"/>
  <circle cx="${W-70}" cy="62" r="3.5" fill="rgba(255,255,255,0.08)"/>
  <circle cx="${W-52}" cy="62" r="3.5" fill="rgba(255,255,255,0.08)"/>

  <!-- Logo box -->
  <rect x="24" y="22" width="58" height="58" rx="14" fill="rgba(0,0,0,0.25)"/>
  <rect x="25" y="23" width="56" height="56" rx="13" fill="#4f46e5"/>
  <text x="53" y="62" font-family="Arial Black,Arial,sans-serif" font-size="30" font-weight="900"
        fill="white" text-anchor="middle">C</text>

  <!-- Company name -->
  <text x="96" y="53" font-family="Arial,sans-serif" font-size="24" font-weight="800"
        fill="#ffffff">CoupenX</text>
  <text x="98" y="72" font-family="Arial,sans-serif" font-size="11.5"
        fill="rgba(255,255,255,0.4)" letter-spacing="4">SCAN &amp; WIN</text>

  <!-- "REWARD COUPON" pill — top-right -->
  <rect x="${W-126}" y="30" width="102" height="26" rx="13"
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
  <text x="${W-75}" y="47" font-family="Arial,sans-serif" font-size="9.5" font-weight="700"
        fill="rgba(255,255,255,0.72)" text-anchor="middle" letter-spacing="1.5">REWARD COUPON</text>

  <!-- ══ PERFORATED TOP TEAR LINE ════════════════════════════════ -->
  <line x1="18" y1="${HEADER_H}" x2="${W-18}" y2="${HEADER_H}"
        stroke="#a5b4fc" stroke-width="1.5" stroke-dasharray="10,7"/>
  <circle cx="0"  cy="${HEADER_H}" r="16" fill="#f0f0ff"/>
  <circle cx="${W}" cy="${HEADER_H}" r="16" fill="#f0f0ff"/>

  <!-- ══ QR AREA ═══════════════════════════════════════════════ -->
  <!-- Frame background -->
  <rect x="${QR_X - 10}" y="${QR_Y - 10}" width="${QR_SIZE + 20}" height="${QR_SIZE + 20}"
        rx="16" fill="#f8f9ff" stroke="#e0e7ff" stroke-width="1.5"/>

  <!-- Corner accent brackets — ALL 4 corners -->
  <!-- Top-left -->
  <rect x="${QR_X - 10}" y="${QR_Y - 10}" width="24" height="4" rx="2" fill="#4f46e5"/>
  <rect x="${QR_X - 10}" y="${QR_Y - 10}" width="4"  height="24" rx="2" fill="#4f46e5"/>
  <!-- Top-right -->
  <rect x="${QR_X + QR_SIZE - 14}" y="${QR_Y - 10}" width="24" height="4" rx="2" fill="#4f46e5"/>
  <rect x="${QR_X + QR_SIZE +  6}" y="${QR_Y - 10}" width="4"  height="24" rx="2" fill="#4f46e5"/>
  <!-- Bottom-left -->
  <rect x="${QR_X - 10}" y="${QR_Y + QR_SIZE + 6}"  width="24" height="4" rx="2" fill="#4f46e5"/>
  <rect x="${QR_X - 10}" y="${QR_Y + QR_SIZE - 14}" width="4"  height="24" rx="2" fill="#4f46e5"/>
  <!-- Bottom-right -->
  <rect x="${QR_X + QR_SIZE - 14}" y="${QR_Y + QR_SIZE + 6}"  width="24" height="4" rx="2" fill="#4f46e5"/>
  <rect x="${QR_X + QR_SIZE +  6}" y="${QR_Y + QR_SIZE - 14}" width="4"  height="24" rx="2" fill="#4f46e5"/>

  <!-- QR code image — perfectly centred, full QR_SIZE -->
  <image x="${QR_X}" y="${QR_Y}" width="${QR_SIZE}" height="${QR_SIZE}"
         href="${qrDataUrl}" preserveAspectRatio="xMidYMid meet"/>

  <!-- ══ PERFORATED BOTTOM TEAR LINE ═══════════════════════════ -->
  <line x1="18" y1="${H - FOOTER_H}" x2="${W-18}" y2="${H - FOOTER_H}"
        stroke="#a5b4fc" stroke-width="1.5" stroke-dasharray="10,7"/>
  <circle cx="0"  cy="${H - FOOTER_H}" r="16" fill="#f0f0ff"/>
  <circle cx="${W}" cy="${H - FOOTER_H}" r="16" fill="#f0f0ff"/>

  <!-- ══ FOOTER ════════════════════════════════════════════════ -->
  <!-- Background (flat top, rounded bottom) -->
  <rect x="0" y="${H - FOOTER_H}"   width="${W}" height="${FOOTER_H}"    fill="#f8fafc"/>
  <rect x="0" y="${H - FOOTER_H}"   width="${W}" height="${FOOTER_H}"    rx="22" fill="#f8fafc"/>
  <rect x="0" y="${H - FOOTER_H}"   width="${W}" height="22"             fill="#f8fafc"/>

  <!-- Barcode-style decorative strip -->
  <rect x="28"  y="${H - FOOTER_H + 12}" width="5"  height="7" rx="1.5" fill="#d1d5db"/>
  <rect x="37"  y="${H - FOOTER_H + 12}" width="9"  height="7" rx="1.5" fill="#d1d5db"/>
  <rect x="50"  y="${H - FOOTER_H + 12}" width="5"  height="7" rx="1.5" fill="#d1d5db"/>
  <rect x="59"  y="${H - FOOTER_H + 12}" width="14" height="7" rx="1.5" fill="#d1d5db"/>
  <rect x="77"  y="${H - FOOTER_H + 12}" width="5"  height="7" rx="1.5" fill="#d1d5db"/>
  <rect x="86"  y="${H - FOOTER_H + 12}" width="7"  height="7" rx="1.5" fill="#d1d5db"/>
  <rect x="97"  y="${H - FOOTER_H + 12}" width="11" height="7" rx="1.5" fill="#d1d5db"/>
  <rect x="112" y="${H - FOOTER_H + 12}" width="5"  height="7" rx="1.5" fill="#d1d5db"/>
  <rect x="121" y="${H - FOOTER_H + 12}" width="9"  height="7" rx="1.5" fill="#d1d5db"/>

  <!-- CODE section -->
  <text x="28" y="${H - FOOTER_H + 42}" font-family="Arial,sans-serif" font-size="10" font-weight="800"
        fill="#94a3b8" letter-spacing="2.5">COUPON CODE</text>
  <text x="28" y="${H - FOOTER_H + 68}" font-family="Courier New,Courier,monospace" font-size="20" font-weight="700"
        fill="#0f172a" letter-spacing="3">${coupon.uniqueCode}</text>

  <!-- Vertical divider -->
  <rect x="252" y="${H - FOOTER_H + 28}" width="1.5" height="${FOOTER_H - 46}" rx="1" fill="#e2e8f0"/>

  <!-- REWARD section -->
  <text x="270" y="${H - FOOTER_H + 42}" font-family="Arial,sans-serif" font-size="10" font-weight="800"
        fill="#94a3b8" letter-spacing="2.5">REWARD</text>
  <text x="264" y="${H - FOOTER_H + 80}" font-family="Arial,sans-serif" font-size="40" font-weight="900"
        fill="url(#prizeG)">&#8377;${coupon.value}</text>

  <!-- Validity note -->
  <text x="${W/2}" y="${H - 10}" font-family="Arial,sans-serif" font-size="8.5"
        fill="#c4c9da" text-anchor="middle" letter-spacing="0.3">
    Single use only · Non-transferable · CoupenX
  </text>

  <!-- Card border -->
  <rect width="${W}" height="${H}" rx="22" fill="none" stroke="#dde1f5" stroke-width="1.5"/>
</svg>`;

            archive.append(Buffer.from(brandedSvg, 'utf-8'), {
                name: `coupon-${coupon.uniqueCode}.svg`
            });
        }

        archive.finalize();
    } catch (err) {
        console.error('ZIP error:', err);
        res.status(500).json({ message: 'ZIP generation failed' });
    }
});


// Fetch QR details by uniqueCode — MUST be after all specific routes
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


// Delete a single QR code
router.delete('/:id', auth, async (req, res) => {
    try {
        await QRCoupon.findByIdAndDelete(req.params.id);
        // Also delete associated submissions if any
        await require('../models/Submission').deleteMany({ qrId: req.params.id });
        res.json({ message: 'QR Code deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// Bulk Delete QR codes
router.post('/bulk-delete', auth, async (req, res) => {
    const { ids } = req.body;
    try {
        await QRCoupon.deleteMany({ _id: { $in: ids } });
        // Also delete associated submissions
        await require('../models/Submission').deleteMany({ qrId: { $in: ids } });
        res.json({ message: 'Bulk delete successful' });
    } catch (err) {
        res.status(500).json({ message: 'Bulk delete failed' });
    }
});

module.exports = router;
