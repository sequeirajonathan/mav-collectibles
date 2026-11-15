// Regenerates the app icons from the logo: npx tsx scripts/pwa/make-icons.ts
import sharp from "sharp";

const NAVY = "#0f2233";

async function icon(size: number, file: string, scale: number) {
  const inner = Math.round(size * scale);
  const logo = await sharp("public/mav_collectibles.png").trim().resize(inner, inner, { fit: "inside" }).toBuffer();
  const backdrop = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><radialGradient id="g" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#1b4a70"/><stop offset="1" stop-color="${NAVY}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  );
  await sharp(backdrop).composite([{ input: logo, gravity: "centre" }]).png().toFile(`public/icons/${file}`);
}

async function main() {
  await icon(192, "icon-192.png", 0.86);
  await icon(512, "icon-512.png", 0.86);
  // Maskable: Android crops to a circle or squircle, so keep the logo in the middle 66%.
  await icon(512, "maskable-512.png", 0.66);
  // iOS home screen (it adds its own rounded corners; no transparency).
  await icon(180, "apple-touch-icon.png", 0.84);
}

void main();
