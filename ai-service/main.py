import base64
import binascii

import cv2
import numpy as np
from fastapi import FastAPI, Response
from insightface.app import FaceAnalysis
from insightface.app.common import Face
from pydantic import BaseModel, ConfigDict, Field

from anti_spoof import check_liveness

MATCH_THRESHOLD = 0.65

# Low, so that a second face that is small, turned or half out of the photo is found too.
FACE_THRESHOLD = 0.3
CLEAR_FACE = 0.5  # below this, a lone face is too unclear to use
BORDER = 0.15  # added around the photo, so that faces at the edges are found
MIN_FACE_WIDTH = 0.18  # part of the photo's width
MAX_FACE_WIDTH = 0.85
EDGE = 0.04  # how far a face may reach past the edge
MAX_TURN = 0.22  # nose away from the middle of the eyes, in eye distances
NOSE_RANGE = (0.3, 0.9)  # nose height between eyes (0) and mouth (1)
MAX_TILT = 25  # degrees
BRIGHTNESS = (45, 225)
MIN_SHARPNESS = 25

app = FastAPI(title="VISITRA face service")

face_app = FaceAnalysis(name="buffalo_l", allowed_modules=["detection", "recognition"])
face_app.prepare(ctx_id=-1, det_thresh=FACE_THRESHOLD)  # CPU


def decode_image(image_base64: str):
    try:
        raw = base64.b64decode(image_base64, validate=True)
    except (binascii.Error, ValueError):
        return None
    return cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)


def find_faces(image):
    h, w = image.shape[:2]
    dy, dx = int(h * BORDER), int(w * BORDER)
    padded = cv2.copyMakeBorder(image, dy, dy, dx, dx, cv2.BORDER_CONSTANT, value=(127, 127, 127))
    boxes, points = face_app.det_model.detect(padded)
    return [
        Face(bbox=box[:4] - (dx, dy, dx, dy), kps=kps - (dx, dy), det_score=box[4])
        for box, kps in zip(boxes, points)
    ]


def photo_problem(image, face):
    """What the person should change, or None when the photo is good."""
    h, w = image.shape[:2]
    x1, y1, x2, y2 = face.bbox
    width = (x2 - x1) / w
    if width > MAX_FACE_WIDTH:
        return "Move back a little."
    if x1 < -EDGE * w or x2 > (1 + EDGE) * w or y1 < -EDGE * h or y2 > (1 + EDGE) * h:
        return "Keep your whole face in the frame."
    if width < MIN_FACE_WIDTH:
        return "Come a little closer."
    if face.det_score < CLEAR_FACE:
        return "Show your face clearly."

    left_eye, right_eye, nose, left_mouth, right_mouth = face.kps
    eyes = (left_eye + right_eye) / 2
    mouth = (left_mouth + right_mouth) / 2
    eye_distance = np.linalg.norm(right_eye - left_eye)
    if eye_distance < 1 or mouth[1] - eyes[1] < 1:
        return "Look straight at the camera."
    tilt = np.degrees(np.arctan2(right_eye[1] - left_eye[1], right_eye[0] - left_eye[0]))
    if abs(tilt) > MAX_TILT:
        return "Keep your head straight."
    # Measured along the face, so that a small tilt does not look like a turn.
    along = (right_eye - left_eye) / eye_distance
    turn = np.dot(nose - eyes, along) / eye_distance
    down = np.array([-along[1], along[0]])
    nose_height = np.dot(nose - eyes, down) / np.dot(mouth - eyes, down)
    if abs(turn) > MAX_TURN or not NOSE_RANGE[0] < nose_height < NOSE_RANGE[1]:
        return "Look straight at the camera."

    crop = image[max(0, int(y1)) : int(y2), max(0, int(x1)) : int(x2)]
    gray = cv2.resize(cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY), (112, 112), interpolation=cv2.INTER_AREA)
    if gray.mean() < BRIGHTNESS[0]:
        return "It is too dark. Face a light."
    if gray.mean() > BRIGHTNESS[1]:
        return "It is too bright. Move away from the light."
    if cv2.Laplacian(gray, cv2.CV_64F).var() < MIN_SHARPNESS:
        return "Hold still."
    return None


def check_photo(image_base64: str):
    """Returns (image, face, None), or (None, None, message) when the photo cannot be used."""
    image = decode_image(image_base64)
    if image is None:
        return None, None, "The photo could not be read. Please try again."

    faces = find_faces(image)
    if not faces:
        message = "No face found. Look at the camera."
    elif len(faces) > 1:
        message = "Only one person, please. Ask others to step aside."
    else:
        message = photo_problem(image, faces[0])
        if message is None and not check_liveness(image):
            message = "Could not confirm a live face. Face a light and look at the camera."
    return (None, None, message) if message else (image, faces[0], None)


class ImageData(BaseModel):
    image_base64: str


# The camera page asks this before it keeps a photo. Same rules as below.
@app.post("/check-face")
def check_face(data: ImageData):
    _, _, message = check_photo(data.image_base64)
    return {"success": message is None, "message": message or ""}


@app.post("/generate-embedding")
def generate_embedding(data: ImageData):
    image, face, message = check_photo(data.image_base64)
    if message:
        return {"success": False, "message": message}
    face_app.models["recognition"].get(image, face)
    return {"success": True, "embedding": face.embedding.tolist()}


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
        if len(visitor.faceEncoding) != len(live):
            continue  # an invalid record must not stop the gate
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
