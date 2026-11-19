import os
import sys
import cv2
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SILENT_FACE_DIR = os.path.join(BASE_DIR, "silent_face")

# Add silent_face folder to Python path
if SILENT_FACE_DIR not in sys.path:
    sys.path.insert(0, SILENT_FACE_DIR)

from src.anti_spoof_predict import AntiSpoofPredict
from src.generate_patches import CropImage
from src.utility import parse_model_name

model_dir = os.path.join(
    SILENT_FACE_DIR,
    "resources",
    "anti_spoof_models"
)

predictor = AntiSpoofPredict(0)
image_cropper = CropImage()

def check_liveness(image):
    if image is None or image.size == 0:
        return False

    model_names = sorted(
        name for name in os.listdir(model_dir) if name.endswith(".pth")
    )
    if not model_names:
        raise RuntimeError(f"No anti-spoof model weights found in {model_dir}")

    prediction = np.zeros((1, 3))

    image_bbox = predictor.get_bbox(image)

    for model_name in model_names:
        h_input, w_input, model_type, scale = parse_model_name(model_name)

        param = {
            "org_img": image,
            "bbox": image_bbox,
            "scale": scale,
            "out_w": w_input,
            "out_h": h_input,
            # The upstream Silent-Face example uses the full image for models
            # whose filename has no scale and crops for scaled models.
            "crop": scale is not None,
        }

        img = image_cropper.crop(**param)

        prediction += predictor.predict(
            img,
            os.path.join(model_dir, model_name)
        )

    # label = np.argmax(prediction)

    # return label == 1

    label = np.argmax(prediction)
    score = prediction[0][label]

    print("Anti-spoof prediction:", prediction, "label:", label, "score:", score)

    return label == 1
