"""Package the approved PNG as a Windows icon; no artwork changes.

Optional asset-maintenance dependency: Pillow. Not needed to build the app.
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent
sizes = [(n, n) for n in (16, 20, 24, 32, 40, 48, 64, 96, 128, 256)]
with Image.open(root / "Ostrov.png") as source:
    if source.mode != "RGBA" or source.width != source.height:
        raise ValueError("The source must be a square RGBA PNG.")
    source.save(root / "Ostrov.ico", format="ICO", sizes=sizes)

with Image.open(root / "Ostrov.ico") as icon:
    if icon.ico.sizes() != set(sizes):
        raise ValueError("The ICO is missing required sizes.")
    print("ICO sizes:", sorted(icon.ico.sizes()))
