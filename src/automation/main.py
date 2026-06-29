import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
CONFIG_FILE = BASE_DIR / "config.json"
ASSETS_ROOT = BASE_DIR / "assets"

print("BASE_DIR :", BASE_DIR)
print("ASSETS_ROOT :", ASSETS_ROOT)

with open(CONFIG_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

for category, collections in data.items():
    for collection_name, designs in collections.items():
        for design_no, variants in designs.items():
            for size, details in variants.items():

                model_path = ASSETS_ROOT / details["modelUrl"].lstrip("/")

                print("\nJSON :", repr(details["modelUrl"]))
                print("PATH :", model_path)
                print("ABS  :", model_path.resolve())
                print("EXISTS :", model_path.exists())