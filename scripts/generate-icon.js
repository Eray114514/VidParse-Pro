const fs = require('fs');
const sharp = require('sharp');

const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
    <linearGradient id="play" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="256" fill="url(#bg)" />
  <path d="M380 320 L740 512 L380 704 Z" fill="url(#play)" />
</svg>
`;

sharp(Buffer.from(svg))
  .png()
  .toFile('public/app-icon.png')
  .then(() => {
    console.log('Icon successfully generated at public/app-icon.png');
  })
  .catch((err) => {
    console.error('Error generating icon:', err);
    process.exit(1);
  });
