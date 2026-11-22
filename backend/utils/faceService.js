const axios = require("axios");
const config = require("../config/env");
const HttpError = require("./httpError");

const MATCH_THRESHOLD = 0.65;

const client = axios.create({
  baseURL: config.aiServiceUrl,
  timeout: 60_000,
  headers: config.aiServiceKey ? { "x-visitra-key": config.aiServiceKey } : {},
});

function toHttpError(err) {
  console.error("[face]", err.message);
  if (config.online) return new HttpError(503, "The photo check did not answer. Please try again.");
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return new HttpError(
      503,
      "Face recognition service is not running. Start it with `npm run dev:all` and wait until it says 'Application startup complete'.",
    );
  }
  if (err.code === "ECONNABORTED") {
    return new HttpError(504, "Face recognition service took too long to respond. Please try again.");
  }
  return new HttpError(502, "Face recognition service returned an error. Check its terminal for details.");
}

async function call(path, body) {
  try {
    const { data } = await client.post(path, body);
    return data;
  } catch (err) {
    throw toHttpError(err);
  }
}

// Tells if a photo can be used: { success, message }.
function checkFace(imageBuffer) {
  return call("/check-face", { image_base64: imageBuffer.toString("base64") });
}

// Returns { success, embedding } or { success: false, message }.
function generateEmbedding(imageBuffer) {
  return call("/generate-embedding", { image_base64: imageBuffer.toString("base64") });
}

// How alike two faces are, from -1 to 1 (cosine).
function likeness(a, b) {
  if (a.length !== b.length) return -1; // an invalid record must not stop the gate
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : -1;
}

// visitors: [{ _id, faceEncoding }] -> { success, visitor_id, similarity }
function findBestMatch(liveEmbedding, visitors) {
  let best = { score: -1, id: "" };
  for (const v of visitors) {
    const score = likeness(liveEmbedding, v.faceEncoding);
    if (score > best.score) best = { score, id: String(v._id) };
  }
  if (best.score < MATCH_THRESHOLD) return { success: false };
  return { success: true, visitor_id: best.id, similarity: Math.round(best.score * 10000) / 100 };
}

// Returns { text }, empty when the image has no QR code.
function decodeQr(imageBuffer) {
  return call("/decode-qr", { image_base64: imageBuffer.toString("base64") });
}

async function isFaceServiceUp() {
  try {
    await client.get("/", { timeout: config.online ? 15_000 : 2_000 });
    return true;
  } catch {
    return false;
  }
}

module.exports = { checkFace, decodeQr, generateEmbedding, findBestMatch, isFaceServiceUp };
