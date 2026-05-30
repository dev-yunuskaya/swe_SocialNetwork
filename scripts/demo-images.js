const fs = require('fs');
const path = require('path');

const DEMO_DIR = path.join(process.cwd(), 'uploads', 'demo');

async function downloadImage(imageSeed, dest) {
  const tags = imageSeed.split('-').filter(Boolean).slice(0, 4).join(',');
  const sources = [
    `https://loremflickr.com/640/400/${encodeURIComponent(tags)}/all`,
    `https://picsum.photos/seed/${encodeURIComponent(imageSeed)}/640/400`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000) continue;
      fs.writeFileSync(dest, buf);
      return;
    } catch {
      // sonraki kaynaga dene
    }
  }

  throw new Error('Gorsel indirilemedi');
}

async function ensurePostImage(imageSeed) {
  if (!imageSeed) return null;

  fs.mkdirSync(DEMO_DIR, { recursive: true });
  const file = `${imageSeed}.jpg`;
  const dest = path.join(DEMO_DIR, file);

  if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
    return file;
  }

  try {
    await downloadImage(imageSeed, dest);
    return file;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`  Gorsel indirilemedi (${imageSeed}): ${err.message}`);
    return null;
  }
}

async function ensureDemoImages() {
  fs.mkdirSync(DEMO_DIR, { recursive: true });
  return DEMO_DIR;
}

module.exports = { ensurePostImage, ensureDemoImages, DEMO_DIR };
