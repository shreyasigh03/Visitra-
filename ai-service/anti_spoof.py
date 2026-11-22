import os
import sys
import threading

import numpy as np
import torch

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SILENT_FACE_DIR = os.path.join(BASE_DIR, "silent_face")

# Add silent_face folder to Python path
if SILENT_FACE_DIR not in sys.path:
    sys.path.insert(0, SILENT_FACE_DIR)

from src.anti_spoof_predict import AntiSpoofPredict
from src.data_io.transform import ToTensor
from src.generate_patches import CropImage
from src.utility import parse_model_name

model_dir = os.path.join(
    SILENT_FACE_DIR,
    "resources",
    "anti_spoof_models"
)

MODEL_NAMES = sorted(name for name in os.listdir(model_dir) if name.endswith(".pth"))
if not MODEL_NAMES:
    raise RuntimeError(f"No anti-spoof model weights found in {model_dir}")

predictor = AntiSpoofPredict(0)
image_cropper = CropImage()
to_tensor = ToTensor()
lock = threading.Lock()  # the OpenCV detector is not safe across threads


def load_model(name):
    predictor._load_model(os.path.join(model_dir, name))
    return predictor.model.eval()


# Loaded once: reading them from disk for every photo is slow.
MODELS = [(parse_model_name(name), load_model(name)) for name in MODEL_NAMES]


def check_liveness(image):
    if image is None or image.size == 0:
        return False

    with lock, torch.no_grad():
        bbox = predictor.get_bbox(image)
        prediction = np.zeros((1, 3))
        for (h_input, w_input, _, scale), model in MODELS:
            # The upstream Silent-Face example uses the full image for models
            # whose filename has no scale and crops for scaled models.
            patch = image_cropper.crop(
                org_img=image, bbox=bbox, scale=scale, out_w=w_input, out_h=h_input, crop=scale is not None
            )
            tensor = to_tensor(patch).unsqueeze(0).to(predictor.device)
            prediction += torch.softmax(model(tensor), dim=1).cpu().numpy()

    return int(np.argmax(prediction)) == 1
