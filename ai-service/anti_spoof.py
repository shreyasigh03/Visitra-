"""Tells a live face from a printed or shown photo, with the Silent-Face models (Apache 2.0)."""
import math
import threading

import cv2
import numpy as np
import onnxruntime

from model_files import model_path

# How much around the face each model looks at.
SCALES = (2.7, 4.0)
SIZE = 80
LIVE = 1

box_finder = cv2.dnn.readNetFromCaffe(model_path("face_box.prototxt"), model_path("face_box.caffemodel"))
sessions = [
    (scale, onnxruntime.InferenceSession(model_path(f"liveness_{scale:g}.onnx"), providers=["CPUExecutionProvider"]))
    for scale in SCALES
]
lock = threading.Lock()  # the OpenCV detector is not safe across threads


def face_box(image):
    h, w = image.shape[:2]
    if w * h >= 192 * 192:
        ratio = math.sqrt(w / h)
        image = cv2.resize(image, (int(192 * ratio), int(192 / ratio)))
    with lock:
        box_finder.setInput(cv2.dnn.blobFromImage(image, 1, mean=(104, 117, 123)), "data")
        found = box_finder.forward("detection_out").squeeze()
    left, top, right, bottom = found[np.argmax(found[:, 2]), 3:7] * (w, h, w, h)
    return int(left), int(top), int(right - left + 1), int(bottom - top + 1)


def crop(image, box, scale):
    h, w = image.shape[:2]
    x, y, box_w, box_h = box
    scale = min((h - 1) / box_h, (w - 1) / box_w, scale)
    new_w, new_h = box_w * scale, box_h * scale
    left, top = x + box_w / 2 - new_w / 2, y + box_h / 2 - new_h / 2
    right, bottom = left + new_w, top + new_h
    # Moved back inside the photo, so that the size stays the same.
    if left < 0:
        left, right = 0, right - left
    if top < 0:
        top, bottom = 0, bottom - top
    if right > w - 1:
        left, right = left - (right - w + 1), w - 1
    if bottom > h - 1:
        top, bottom = top - (bottom - h + 1), h - 1
    return cv2.resize(image[int(top) : int(bottom) + 1, int(left) : int(right) + 1], (SIZE, SIZE))


def check_liveness(image):
    if image is None or image.size == 0:
        return False
    box = face_box(image)
    total = np.zeros(3)
    for scale, session in sessions:
        patch = crop(image, box, scale).astype(np.float32).transpose(2, 0, 1)[None]
        out = session.run(None, {"input": patch})[0][0]
        e = np.exp(out - out.max())
        total += e / e.sum()
    return int(np.argmax(total)) == LIVE
