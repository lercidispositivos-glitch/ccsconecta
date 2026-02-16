// Generate PWA icons as simple PNGs using pure Node.js
// Creates a dark navy background with "CCS" text in gold
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a minimal valid PNG with a solid color background
// Using raw PNG creation with zlib
import zlib from 'zlib';

function createPNG(width, height, bgR, bgG, bgB) {
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // bit depth
    ihdrData[9] = 2; // color type (RGB)
    ihdrData[10] = 0; // compression
    ihdrData[11] = 0; // filter
    ihdrData[12] = 0; // interlace
    const ihdr = createChunk('IHDR', ihdrData);

    // IDAT chunk - image data
    // Create raw image data with filter bytes
    const rawData = Buffer.alloc((width * 3 + 1) * height);

    // Draw background and a simple centered circle/icon shape
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = width * 0.38;
    const innerRadius = width * 0.28;

    // Gold color for icon element
    const goldR = 212, goldG = 168, goldB = 67;
    // Lighter gold for inner elements
    const lightGoldR = 230, lightGoldG = 195, lightGoldB = 110;

    for (let y = 0; y < height; y++) {
        const rowOffset = y * (width * 3 + 1);
        rawData[rowOffset] = 0; // filter: none
        for (let x = 0; x < width; x++) {
            const pixelOffset = rowOffset + 1 + x * 3;
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Draw a ring (people/connection symbol)
            if (dist <= outerRadius && dist >= innerRadius) {
                rawData[pixelOffset] = goldR;
                rawData[pixelOffset + 1] = goldG;
                rawData[pixelOffset + 2] = goldB;
            }
            // Draw three small circles on the ring (representing people)
            else if (isPersonDot(x, y, centerX, centerY, outerRadius * 0.83, width * 0.08, 3)) {
                rawData[pixelOffset] = lightGoldR;
                rawData[pixelOffset + 1] = lightGoldG;
                rawData[pixelOffset + 2] = lightGoldB;
            }
            // Draw center dot
            else if (dist <= width * 0.08) {
                rawData[pixelOffset] = goldR;
                rawData[pixelOffset + 1] = goldG;
                rawData[pixelOffset + 2] = goldB;
            }
            // Draw connection lines from center to dots
            else if (isConnectionLine(x, y, centerX, centerY, outerRadius * 0.83, width * 0.015, 3)) {
                rawData[pixelOffset] = Math.floor(goldR * 0.7);
                rawData[pixelOffset + 1] = Math.floor(goldG * 0.7);
                rawData[pixelOffset + 2] = Math.floor(goldB * 0.7);
            }
            else {
                // Background - dark navy
                rawData[pixelOffset] = bgR;
                rawData[pixelOffset + 1] = bgG;
                rawData[pixelOffset + 2] = bgB;
            }
        }
    }

    const compressed = zlib.deflateSync(rawData);
    const idat = createChunk('IDAT', compressed);

    // IEND chunk
    const iend = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdr, idat, iend]);
}

function isPersonDot(x, y, cx, cy, radius, dotRadius, count) {
    for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI / count) - Math.PI / 2;
        const dotX = cx + radius * Math.cos(angle);
        const dotY = cy + radius * Math.sin(angle);
        const dx = x - dotX;
        const dy = y - dotY;
        if (Math.sqrt(dx * dx + dy * dy) <= dotRadius) return true;
    }
    return false;
}

function isConnectionLine(x, y, cx, cy, radius, lineWidth, count) {
    for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI / count) - Math.PI / 2;
        const endX = cx + radius * Math.cos(angle);
        const endY = cy + radius * Math.sin(angle);

        // Distance from point to line segment
        const dx = endX - cx;
        const dy = endY - cy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const t = Math.max(0, Math.min(1, ((x - cx) * dx + (y - cy) * dy) / (len * len)));
        const projX = cx + t * dx;
        const projY = cy + t * dy;
        const distToLine = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);

        if (distToLine <= lineWidth) return true;
    }
    return false;
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            if (crc & 1) {
                crc = (crc >>> 1) ^ 0xEDB88320;
            } else {
                crc = crc >>> 1;
            }
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
// Dark navy: #003366 = rgb(0, 51, 102)
const icon192 = createPNG(192, 192, 0, 51, 102);
const icon512 = createPNG(512, 512, 0, 51, 102);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);

console.log('✅ Icons generated successfully!');
console.log(`  - ${path.join(iconsDir, 'icon-192.png')} (${icon192.length} bytes)`);
console.log(`  - ${path.join(iconsDir, 'icon-512.png')} (${icon512.length} bytes)`);
