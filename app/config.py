from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / "data" / "car.data"
APP_NAME = "Vehicle AI Evaluator"
APP_VERSION = "1.0.0"
TEST_SIZE = 0.2
RANDOM_STATE = 42

FEATURE_NAMES = ["buying", "maint", "doors", "persons", "lug_boot", "safety"]
TARGET_NAME = "class"

ALLOWED_VALUES = {
    "buying": ["low", "med", "high", "vhigh"],
    "maint": ["low", "med", "high", "vhigh"],
    "doors": ["2", "3", "4", "5more"],
    "persons": ["2", "4", "more"],
    "lug_boot": ["small", "med", "big"],
    "safety": ["low", "med", "high"],
}

CLASS_DESCRIPTIONS = {
    "unacc": "unacceptable",
    "acc": "acceptable",
    "good": "good",
    "vgood": "very good",
}
