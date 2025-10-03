const qrcode = require('qrcode-generator');

/**
 * Generate a trapezoid-warped QR code SVG puzzle:
 * - Finder patterns removed
 * - Inverted colors (white on black)
 * - Warped into a trapezoid (unscannable directly)
 * - Extra noise shapes added
 */
async function generateDistortedQRCode(flag, options = {}) {
  const svgSize = options.size || 400;
  const marginModules = options.margin || 4;
  const ecc = options.errorCorrection || 'H';

  // Create QR
  const qr = qrcode(0, ecc);
  qr.addData(flag);
  qr.make();
  const moduleCount = qr.getModuleCount();

  const totalModules = moduleCount + (marginModules * 2);
  const moduleSize = svgSize / totalModules;
  const quietZonePx = marginModules * moduleSize;

  // Build SVG
  let svgParts = [];
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`
  );

  // Background: BLACK
  svgParts.push(`<rect width="100%" height="100%" fill="#000"/>`);

  // Define trapezoid clipping path
  // Top is narrower, bottom is wider -> impossible for scanner to read
  svgParts.push(`
    <defs>
      <clipPath id="trapezoidWarp">
        <polygon points="
          ${svgSize * 0.2},0
          ${svgSize * 0.8},0
          ${svgSize},${svgSize}
          0,${svgSize}
        " />
      </clipPath>
    </defs>
  `);

  // Apply warp via clipPath
  svgParts.push(`<g clip-path="url(#trapezoidWarp)">`);

  // Draw inverted modules (white squares)
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) {
        const x = quietZonePx + c * moduleSize;
        const y = quietZonePx + r * moduleSize;
        svgParts.push(
          `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="#fff" />`
        );
      }
    }
  }

  svgParts.push(`</g>`);

  // Remove finder patterns with solid black rectangles
  const finderSizeModules = 7;
  const finderPx = finderSizeModules * moduleSize;
  const positions = [
    [0, 0],
    [moduleCount - finderSizeModules, 0],
    [0, moduleCount - finderSizeModules],
  ];
  positions.forEach(([cx, cy]) => {
    const px = quietZonePx + cx * moduleSize;
    const py = quietZonePx + cy * moduleSize;
    svgParts.push(
      `<rect x="${px}" y="${py}" width="${finderPx}" height="${finderPx}" fill="#000"/>`
    );
  });

  // Add semi-transparent noise shapes
  for (let i = 0; i < 15; i++) {
    const nx = Math.random() * svgSize;
    const ny = Math.random() * svgSize;
    const r = Math.random() * (moduleSize * 2);
    svgParts.push(
      `<circle cx="${nx}" cy="${ny}" r="${r}" fill="rgba(255,255,255,0.08)"/>`
    );
  }

  svgParts.push(`</svg>`);
  const svg = svgParts.join("\n");

  // Encode as base64
  const base64 = Buffer.from(svg).toString("base64");
  const dataUrl = `data:image/svg+xml;base64,${base64}`;

  return { svg, dataUrl };
}

module.exports = { generateDistortedQRCode };
