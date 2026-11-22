const axios = require("axios");
const config = require("../config/env");
const HttpError = require("./httpError");

const client = axios.create({ baseURL: config.aiServiceUrl, timeout: 60_000 });

function toHttpError(err) {
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return new HttpError(
      503,
      config.online
        ? "The photo check is not available right now. Please register at the reception."
        : "Face recognition service is not running. Start it with `npm run dev:all` and wait until it says 'Application startup complete'.",
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

// visitors: [{ _id, faceEncoding }] -> { success, visitor_id, similarity }
function findBestMatch(liveEmbedding, visitors) {
  return call("/compare-embedding", {
    liveEmbedding,
    visitors: visitors.map((v) => ({ _id: String(v._id), faceEncoding: v.faceEncoding })),
  });
}

// Returns { text }, empty when the image has no QR code.
function decodeQr(imageBuffer) {
  return call("/decode-qr", { image_base64: imageBuffer.toString("base64") });
}

async function isFaceServiceUp() {
  try {
    await client.get("/", { timeout: 2_000 });
    return true;
  } catch {
    return false;
  }
}

module.exports = { checkFace, decodeQr, generateEmbedding, findBestMatch, isFaceServiceUp };
