"""Downloads the two large InsightFace models, compressed, for Vercel (see vercel.json)."""
import gzip
import hashlib
import os
import urllib.request

from model_files import FOLDERS

BASE = "https://huggingface.co/public-data/insightface/resolve/33c1063c49c785b7652d3fd529f86fa4f149392b/models/buffalo_l/"
# The same files as on the computer where VISITRA was made.
FILES = {
    "det_10g.onnx": "5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91",
    "w600k_r50.onnx": "4c06341c33c2ca1f86781dab0e829f88ad5b64be9fba56e56bc9ebdefc619e43",
}


def download(name, sha256):
    path = os.path.join(FOLDERS[0], name + ".gz")
    digest = hashlib.sha256()
    with urllib.request.urlopen(BASE + name, timeout=120) as source, gzip.open(path, "wb", compresslevel=6) as target:
        while chunk := source.read(1 << 20):
            digest.update(chunk)
            target.write(chunk)
    if digest.hexdigest() != sha256:
        raise RuntimeError(f"{name} did not download correctly.")
    print(name, os.path.getsize(path) // 1_000_000, "MB")


if __name__ == "__main__":
    for file_name, checksum in FILES.items():
        download(file_name, checksum)
