"""Where the model files are."""
import gzip
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FOLDERS = (
    os.path.join(HERE, "models"),  # small ones, and everything online
    os.path.expanduser("~/.insightface/models/buffalo_l"),  # large ones on this computer
)


def model_path(name):
    for folder in FOLDERS:
        path = os.path.join(folder, name)
        if os.path.exists(path):
            return path
    raise FileNotFoundError(f"{name} is missing. Run: python download_models.py")


def read_model(name):
    """The model's content. Online the large ones are compressed, to fit Vercel's size limit."""
    packed = os.path.join(FOLDERS[0], name + ".gz")
    if os.path.exists(packed):
        with gzip.open(packed) as file:
            return file.read()
    with open(model_path(name), "rb") as file:
        return file.read()
