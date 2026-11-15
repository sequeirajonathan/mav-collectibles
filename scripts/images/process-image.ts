/**
 * Turns a raw product photo into a uniform, web-ready image:
 *
 * - "cutout": products shot on a plain light background (packs, boxes,
 *   supplies) get the background removed and are trimmed to the product.
 * - "photo": everything else (card scans, real photos) keeps its pixels; plain
 *   borders are trimmed and the corners are rounded.
 *
 * Output is always WebP with transparency, at most MAX_SIDE px on the long side.
 * The original is never modified.
 */
import { mkdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import * as ort from "onnxruntime-node";
import sharp, { type Sharp } from "sharp";

const MAX_SIDE = 800;
const MODEL_SIZE = 1024;
const MODEL_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx";
const MODEL_PATH = path.join(process.cwd(), ".cache/models/isnet-general-use.onnx");

type ImageKind = "cutout" | "photo";
interface ProcessedImage {
  data: Buffer;
  kind: ImageKind;
  width: number;
  height: number;
}

let session: Promise<ort.InferenceSession> | undefined;

/** Loads the background-removal model (IS-Net, ~170 MB), downloading it once. */
function model(): Promise<ort.InferenceSession> {
  session ??= (async () => {
    const exists = await stat(MODEL_PATH).then((s) => s.size > 1_000_000, () => false);
    if (!exists) {
      await mkdir(path.dirname(MODEL_PATH), { recursive: true });
      const response = await fetch(MODEL_URL);
      if (!response.ok) throw new Error(`Couldn't download the model: HTTP ${response.status}`);
      const tmp = `${MODEL_PATH}.part`;
      await writeFile(tmp, Buffer.from(await response.arrayBuffer()));
      await rename(tmp, MODEL_PATH);
    }
    return ort.InferenceSession.create(MODEL_PATH, { graphOptimizationLevel: "all" });
  })();
  return session;
}

interface Border {
  /** Share of the outer frame that is near-white. */
  light: number;
  /** Share of the outer frame that is near-black. */
  dark: number;
}

/** How much of the image's outer frame is plain white or plain black. */
async function borderStats(image: Sharp): Promise<Border> {
  const size = 96;
  const { data, info } = await image.clone().resize(size, size, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const ring = 3;
  let total = 0;
  let light = 0;
  let dark = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x >= ring && x < size - ring && y >= ring && y < size - ring) continue;
      const i = (y * size + x) * info.channels;
      const lo = Math.min(data[i], data[i + 1], data[i + 2]);
      const hi = Math.max(data[i], data[i + 1], data[i + 2]);
      total++;
      if (lo > 236) light++;
      else if (hi < 30) dark++;
    }
  }
  return { light: light / total, dark: dark / total };
}

/** Foreground mask (0–255, one byte per pixel) at the image's own size. */
async function foregroundMask(image: Sharp, width: number, height: number): Promise<Buffer> {
  const { data } = await image
    .clone()
    .resize(MODEL_SIZE, MODEL_SIZE, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const plane = MODEL_SIZE * MODEL_SIZE;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    input[i] = data[i * 3] / 255 - 0.5;
    input[plane + i] = data[i * 3 + 1] / 255 - 0.5;
    input[2 * plane + i] = data[i * 3 + 2] / 255 - 0.5;
  }
  const net = await model();
  const result = await net.run({ [net.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, MODEL_SIZE, MODEL_SIZE]) });
  const output = result[net.outputNames[0]].data;
  if (!(output instanceof Float32Array)) throw new Error("Unexpected model output");

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < plane; i++) {
    if (output[i] < min) min = output[i];
    if (output[i] > max) max = output[i];
  }
  const range = max - min || 1;
  const mask = Buffer.alloc(plane);
  for (let i = 0; i < plane; i++) {
    // Tighten the soft edge so no pale halo of the old background survives.
    const a = ((output[i] - min) / range - 0.15) / 0.7;
    mask[i] = Math.round(Math.min(1, Math.max(0, a)) * 255);
  }
  const resized = await sharp(mask, { raw: { width: MODEL_SIZE, height: MODEL_SIZE, channels: 1 } })
    .resize(width, height, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  // sharp may hand back more than one channel; keep the first.
  const channels = resized.info.channels;
  if (channels === 1) return resized.data;
  const single = Buffer.alloc(width * height);
  for (let i = 0; i < single.length; i++) single[i] = resized.data[i * channels];
  return single;
}

/**
 * Marks the pixels that could be background: light, colourless, and connected
 * to the image edge through other such pixels. Anything else (a cream box, a
 * white label inside a dark outline) is never removed, whatever the model says.
 */
function edgeConnectedBackground(rgb: Buffer, step: number, width: number, height: number): Uint8Array {
  const total = width * height;
  const plain = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const r = rgb[i * step];
    const g = rgb[i * step + (step > 1 ? 1 : 0)];
    const b = rgb[i * step + (step > 2 ? 2 : 0)];
    const lo = Math.min(r, g, b);
    if (lo > 205 && Math.max(r, g, b) - lo < 16) plain[i] = 1;
  }
  const background = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const push = (i: number) => {
    if (plain[i] && !background[i]) {
      background[i] = 1;
      queue[tail++] = i;
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (i >= width) push(i - width);
    if (i < total - width) push(i + width);
  }
  return background;
}

/**
 * Clears stray fragments (caption text, dust) far smaller than the product
 * itself, so they don't push the trimmed product off-centre.
 */
function dropSmallFragments(rgba: Buffer, width: number, height: number): void {
  const total = width * height;
  const label = new Int32Array(total);
  const queue = new Int32Array(total);
  const sizes: number[] = [0];
  for (let start = 0; start < total; start++) {
    if (label[start] || rgba[start * 4 + 3] <= 32) continue;
    const id = sizes.length;
    let head = 0;
    let tail = 0;
    label[start] = id;
    queue[tail++] = start;
    while (head < tail) {
      const i = queue[head++];
      const x = i % width;
      const visit = (j: number) => {
        if (!label[j] && rgba[j * 4 + 3] > 32) {
          label[j] = id;
          queue[tail++] = j;
        }
      };
      if (x > 0) visit(i - 1);
      if (x < width - 1) visit(i + 1);
      if (i >= width) visit(i - width);
      if (i < total - width) visit(i + width);
    }
    sizes.push(tail);
  }
  const keep = Math.max(...sizes) * 0.02;
  for (let i = 0; i < total; i++) {
    if (label[i] && sizes[label[i]] < keep) rgba[i * 4 + 3] = 0;
  }
}

/**
 * True when the area about to be removed contains outlines or detail. Real
 * backgrounds are flat; edges in the removed area mean part of the product
 * (a white wrapper, a pale box) is being cut away.
 */
function removesDetail(rgba: Buffer, width: number, height: number): boolean {
  const step = Math.max(1, Math.round(Math.max(width, height) / 320));
  const w = Math.floor(width / step);
  const h = Math.floor(height / step);
  const gray = new Float32Array(w * h);
  const removed = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * step * width + x * step) * 4;
      gray[y * w + x] = (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3;
      removed[y * w + x] = rgba[i + 3] < 32 ? 1 : 0;
    }
  }
  let area = 0;
  let edges = 0;
  const margin = 3;
  for (let y = margin; y < h - margin; y++) {
    for (let x = margin; x < w - margin; x++) {
      const i = y * w + x;
      // Only look well inside the removed area, away from the product's own edge.
      if (!removed[i] || !removed[i - margin] || !removed[i + margin] || !removed[i - margin * w] || !removed[i + margin * w]) continue;
      area++;
      if (Math.abs(gray[i + 1] - gray[i - 1]) + Math.abs(gray[i + w] - gray[i - w]) > 22) edges++;
    }
  }
  return area > 0 && edges / area > 0.012;
}

async function cutout(image: Sharp, width: number, height: number): Promise<Buffer | null> {
  const mask = await foregroundMask(image, width, height);
  const { data: rgb, info } = await image.clone().removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  const step = info.channels;
  const background = edgeConnectedBackground(rgb, step, width, height);

  const rgba = Buffer.alloc(width * height * 4);
  let kept = 0;
  for (let i = 0; i < width * height; i++) {
    const alpha = background[i] ? mask[i] : 255;
    if (alpha > 127) kept++;
    rgba[i * 4] = rgb[i * step];
    rgba[i * 4 + 1] = rgb[i * step + (step > 1 ? 1 : 0)];
    rgba[i * 4 + 2] = rgb[i * step + (step > 2 ? 2 : 0)];
    rgba[i * 4 + 3] = alpha;
  }
  if (removesDetail(rgba, width, height)) return null;
  dropSmallFragments(rgba, width, height);
  const coverage = kept / (width * height);
  // Keeping almost nothing or almost everything means there was no clear
  // subject on a plain background; the caller falls back to the photo path.
  if (coverage < 0.04 || coverage > 0.97) return null;
  return sharp(rgba, { raw: { width, height, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
}

async function roundedPhoto(image: Sharp, trimBorder: boolean): Promise<Buffer> {
  // Card scans often sit on a black or white mat; remove it so the card fills the tile.
  const base = trimBorder ? await image.clone().trim({ threshold: 24 }).toBuffer().catch(() => image.clone().toBuffer()) : await image.clone().toBuffer();
  const meta = await sharp(base).metadata();
  const width = meta.width;
  const height = meta.height;
  const radius = Math.round(Math.min(width, height) * 0.035);
  const corners = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/></svg>`
  );
  return sharp(base).ensureAlpha().composite([{ input: corners, blend: "dest-in" }]).png().toBuffer();
}

export async function processImage(source: Buffer): Promise<ProcessedImage> {
  // Work at a bounded size; never upscale small originals.
  const working = await sharp(source).rotate().flatten({ background: "#ffffff" }).resize(1400, 1400, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
  const image = sharp(working);
  const { width, height } = await image.metadata();
  const border = await borderStats(image);

  const plainLight = border.light > 0.4;
  const plainDark = border.dark > 0.7;

  let kind: ImageKind = "photo";
  let result: Buffer | null = null;
  if (plainLight) {
    result = await cutout(image, width, height);
    if (result) kind = "cutout";
  }
  result ??= await roundedPhoto(image, plainLight || plainDark);

  const { data, info } = await sharp(result)
    .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  return { data, kind, width: info.width, height: info.height };
}
