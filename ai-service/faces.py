"""Finds faces and turns a face into numbers, with the InsightFace buffalo_l models."""
from dataclasses import dataclass

import cv2
import numpy as np
import onnxruntime

from model_files import read_model

DETECT_SIZES = (128, 640)  # small for a very close face, large for the rest
STRIDES = (8, 16, 32)
ANCHORS = 2
OVERLAP = 0.4  # more overlap than this is the same face
# Where the eyes, nose and mouth must be in the 112 x 112 picture for recognition.
TEMPLATE = np.array(
    [[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]],
    dtype=np.float32,
)


@dataclass
class Face:
    bbox: np.ndarray
    kps: np.ndarray  # eyes, nose, corners of the mouth
    det_score: float


def open_model(name):
    options = onnxruntime.SessionOptions()
    options.log_severity_level = 3
    return onnxruntime.InferenceSession(read_model(name), options, providers=["CPUExecutionProvider"])


detector = open_model("det_10g.onnx")
recognizer = open_model("w600k_r50.onnx")


def _candidates(image, size, threshold):
    h, w = image.shape[:2]
    if h > w:
        new_h, new_w = size, int(size * w / h)
    else:
        new_h, new_w = int(size * h / w), size
    scale = new_h / h
    canvas = np.zeros((size, size, 3), dtype=np.uint8)
    canvas[:new_h, :new_w] = cv2.resize(image, (new_w, new_h))
    blob = cv2.dnn.blobFromImage(canvas, 1 / 128, (size, size), (127.5, 127.5, 127.5), swapRB=True)
    outputs = detector.run(None, {detector.get_inputs()[0].name: blob})

    found = []
    for i, stride in enumerate(STRIDES):
        scores, boxes, points = outputs[i].ravel(), outputs[i + 3] * stride, outputs[i + 6] * stride
        cells = size // stride
        centers = np.stack(np.mgrid[:cells, :cells][::-1], axis=-1).reshape(-1, 2).astype(np.float32) * stride
        centers = np.repeat(centers, ANCHORS, axis=0)
        keep = scores >= threshold
        c, b, p = centers[keep], boxes[keep], points[keep].reshape(-1, 5, 2)
        corners = np.hstack([c - b[:, :2], c + b[:, 2:]])
        found.append((corners / scale, (p + c[:, None]) / scale, scores[keep]))
    return [np.concatenate(part) for part in zip(*found)]


def _without_repeats(boxes, scores):
    order = scores.argsort()[::-1]
    areas = (boxes[:, 2] - boxes[:, 0] + 1) * (boxes[:, 3] - boxes[:, 1] + 1)
    keep = []
    while order.size:
        i, rest = order[0], order[1:]
        keep.append(i)
        left_top = np.maximum(boxes[i, :2], boxes[rest, :2])
        right_bottom = np.minimum(boxes[i, 2:], boxes[rest, 2:])
        w, h = np.maximum(0, right_bottom - left_top + 1).T
        shared = w * h
        order = rest[shared / (areas[i] + areas[rest] - shared) <= OVERLAP]
    return keep


def detect(image, threshold):
    parts = [_candidates(image, size, threshold) for size in DETECT_SIZES]
    boxes, points, scores = (np.concatenate(part) for part in zip(*parts))
    return [Face(boxes[i], points[i], float(scores[i])) for i in _without_repeats(boxes, scores)]


def _align(points):
    """The turn, size and move that put these points on the template (Umeyama)."""
    src_mean, dst_mean = points.mean(axis=0), TEMPLATE.mean(axis=0)
    src, dst = points - src_mean, TEMPLATE - dst_mean
    u, s, vt = np.linalg.svd(dst.T @ src / len(points))
    d = np.array([1.0, np.sign(np.linalg.det(u) * np.linalg.det(vt))])
    rotation = u @ np.diag(d) @ vt
    scale = (s * d).sum() / src.var(axis=0).sum()
    return np.hstack([scale * rotation, (dst_mean - scale * rotation @ src_mean)[:, None]])


def embed(image, face):
    crop = cv2.warpAffine(image, _align(face.kps.astype(np.float64)), (112, 112), borderValue=0.0)
    blob = cv2.dnn.blobFromImage(crop, 1 / 127.5, (112, 112), (127.5, 127.5, 127.5), swapRB=True)
    return recognizer.run(None, {recognizer.get_inputs()[0].name: blob})[0].ravel()
