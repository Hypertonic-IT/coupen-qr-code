/**
 * ESC/POS Thermal Printing SDK for Web Browser (Vite/React)
 * Handles direct printing via Web Bluetooth (BLE) and Web Serial (USB COM port).
 */

import QRCode from 'qrcode';

export class EscPosBuilder {
    constructor() {
        this.buffer = [];
    }

    addBytes(bytes) {
        if (Array.isArray(bytes)) {
            this.buffer.push(...bytes);
        } else if (bytes instanceof Uint8Array) {
            this.buffer.push(...Array.from(bytes));
        } else {
            this.buffer.push(bytes);
        }
        return this;
    }

    init() {
        return this.addBytes([0x1B, 0x40]);
    }

    alignLeft() {
        return this.addBytes([0x1B, 0x61, 0x00]);
    }

    alignCenter() {
        return this.addBytes([0x1B, 0x61, 0x01]);
    }

    alignRight() {
        return this.addBytes([0x1B, 0x61, 0x02]);
    }

    boldOn() {
        return this.addBytes([0x1B, 0x45, 0x01]);
    }

    boldOff() {
        return this.addBytes([0x1B, 0x45, 0x00]);
    }

    textLarge() {
        return this.addBytes([0x1D, 0x21, 0x11]); // Double width, double height
    }

    textNormal() {
        return this.addBytes([0x1D, 0x21, 0x00]); // Normal size
    }

    textMedium() {
        return this.addBytes([0x1D, 0x21, 0x01]); // Double height, normal width
    }

    textDoubleWidth() {
        return this.addBytes([0x1D, 0x21, 0x10]); // Double width, normal height
    }

    text(str) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        return this.addBytes(bytes);
    }

    lineFeed(count = 1) {
        for (let i = 0; i < count; i++) {
            this.addBytes([0x0A]);
        }
        return this;
    }

    qrCode(data, size = 8) {
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(data);
        const len = dataBytes.length + 3;
        const pL = len % 256;
        const pH = Math.floor(len / 256);

        // 1. Model 2
        this.addBytes([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
        // 2. Set Size
        this.addBytes([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, size]);
        // 3. Set Error Correction Level M
        this.addBytes([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x46, 0x31]);
        // 4. Store Data in Buffer
        this.addBytes([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
        this.addBytes(dataBytes);
        // 5. Print QR Code
        this.addBytes([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);
        
        return this;
    }

    qrCodeRaster(data, scaleFactor = 10, quietZone = 2) {
        const bytes = getQrRasterBytes(data, scaleFactor, quietZone);
        return this.addBytes(bytes);
    }

    cut() {
        return this.addBytes([0x1D, 0x56, 0x42, 0x00]);
    }

    build() {
        return new Uint8Array(this.buffer);
    }
}

/**
 * Generates universally supported ESC/POS GS v 0 1-bit raster graphics bytes for a QR Code
 */
export function getQrRasterBytes(text, scaleFactor = 10, quietZone = 2) {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
    const N = qr.modules.size;
    const moduleWidth = N + 2 * quietZone;
    let pixelWidth = moduleWidth * scaleFactor;
    
    // Pad width to a multiple of 8 pixels
    pixelWidth = Math.ceil(pixelWidth / 8) * 8;
    const pixelHeight = moduleWidth * scaleFactor;
    const bytesPerRow = pixelWidth / 8;

    const dataBytes = new Uint8Array(bytesPerRow * pixelHeight);

    for (let y = 0; y < pixelHeight; y++) {
        const gridRow = Math.floor(y / scaleFactor) - quietZone;
        if (gridRow < 0 || gridRow >= N) continue;

        for (let x = 0; x < pixelWidth; x++) {
            const gridCol = Math.floor(x / scaleFactor) - quietZone;
            if (gridCol < 0 || gridCol >= N) continue;

            const isBlack = qr.modules.get(gridRow, gridCol) === 1;
            if (isBlack) {
                const byteIdx = y * bytesPerRow + Math.floor(x / 8);
                const bitPos = 7 - (x % 8);
                dataBytes[byteIdx] |= (1 << bitPos);
            }
        }
    }

    const xL = bytesPerRow % 256;
    const xH = Math.floor(bytesPerRow / 256);
    const yL = pixelHeight % 256;
    const yH = Math.floor(pixelHeight / 256);

    const header = [0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH];
    const result = new Uint8Array(header.length + dataBytes.length);
    result.set(header, 0);
    result.set(dataBytes, header.length);
    return result;
}

/**
 * Sends ESC/POS byte array to GATT characteristic in chunked writes
 */
export async function writeBluetoothChunks(characteristic, data) {
    const CHUNK_SIZE = 40; // 40-byte chunks are safe for virtually all BLE thermal printers
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await characteristic.writeValueWithoutResponse(chunk);
        await new Promise(resolve => setTimeout(resolve, 20)); // 20ms pacing prevents buffer overflow
    }
}

/**
 * Builds the standard ESC/POS coupon batch receipt
 */
export function buildCouponPrintJob(coupons, printSize = 'medium') {
    const builder = new EscPosBuilder();
    builder.init();

    // Map printSize to scaleFactor
    let scaleFactor = 10;
    if (printSize === 'large') scaleFactor = 12;
    else if (printSize === 'small') scaleFactor = 8;
    else if (printSize === 'compact') scaleFactor = 6;
    else if (printSize === 'thermal') scaleFactor = 10;

    coupons.forEach((qr, idx) => {
        const url = `${window.location.origin}/coupon/${qr.uniqueCode}`;
        
        builder.alignCenter();
        
        // Header
        builder.boldOn();
        builder.textMedium(); // Double-Height, Normal-Width (highly elegant, no stretch)
        builder.text("COUPENX");
        builder.lineFeed(1);

        builder.textNormal();
        builder.text("SCAN & WIN COUPON");
        builder.lineFeed(1); // Elegant compact spacing

        // Hardware QR Code - printed using raw raster bit image
        builder.qrCodeRaster(url, scaleFactor, 2);
        builder.lineFeed(1);

        // Price Section
        builder.boldOn();
        builder.textMedium(); // Double-Height, Normal-Width
        builder.text(`INR ${qr.value}`);
        builder.lineFeed(1);

        // Code Details
        builder.textNormal();
        builder.boldOff();
        builder.text(`Code: ${qr.uniqueCode}`);
        builder.lineFeed(2);

        // Tear Separator
        builder.text("------------------------");
        builder.lineFeed(3); // Tear space
    });

    builder.cut();
    return builder.build();
}
