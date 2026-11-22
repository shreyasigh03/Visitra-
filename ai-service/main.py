import base64
import binascii

import cv2
import numpy as np
from fastapi import FastAPI, Response
from insightface.app import FaceAnalysis
from pydantic import BaseModel, ConfigDict, Field

from anti_spoof import check_liveness

MATCH_THRESHOLD = 0.65

app = FastAPI(title="VISITRA face service")

face_app = FaceAnalysis(name="buffalo_l")
face_app.prepare(ctx_id=-1)  # CPU


def decode_image(image_base64: str):
    try:
        raw = base64.b64decode(image_base64, validate=True)
    except (binascii.Error, ValueError):
        return None
    return cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)


class ImageData(BaseModel):
    image_base64: str


@app.post("/generate-embedding")
def generate_embedding(data: ImageData):
    image = decode_image(data.image_base64)
    if image is None:
        return {"success": False, "message": "The photo could not be read. Please capture again."}

    faces = face_app.get(image)
    if len(faces) == 0:
        return {
            "success": False,
            "message": "No face detected. Make sure your face is clearly visible and capture again.",
        }
    if len(faces) > 1:
        return {
            "success": False,
            "message": "Multiple faces detected. Please ensure only one person is in the frame.",
        }

    if not check_liveness(image):
        return {
            "success": False,
            "message": "The camera check could not confirm a live face. Face the camera directly in good lighting and capture again.",
        }

    return {"success": True, "embedding": faces[0].embedding.tolist()}


class VisitorEmbedding(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(alias="_id")
    faceEncoding: list[float]


class CompareRequest(BaseModel):
    liveEmbedding: list[float]
    visitors: list[VisitorEmbedding]


def normalize(vector):
    arr = np.asarray(vector, dtype=np.float32)
    return arr / np.linalg.norm(arr)


@app.post("/compare-embedding")
def compare_embedding(data: CompareRequest):
    live = normalize(data.liveEmbedding)
    best_score, best_id = -1.0, None

    for visitor in data.visitors:
        score = float(np.dot(live, normalize(visitor.faceEncoding)))  # cosine similarity
        if score > best_score:
            best_score, best_id = score, visitor.id

    if best_id is not None and best_score >= MATCH_THRESHOLD:
        return {"success": True, "visitor_id": best_id, "similarity": round(best_score * 100, 2)}
    return {"success": False}


@app.post("/decode-qr")
def decode_qr(data: ImageData):
    image = decode_image(data.image_base64)
    if image is None:
        return {"text": ""}
    # A new detector per call: OpenCV's is not safe across threads.
    text, _, _ = cv2.QRCodeDetector().detectAndDecode(image)
    return {"text": text}


@app.get("/")
def home():
    return {"message": "AI Service Running"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)
