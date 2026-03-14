from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
TARGET_SCRIPT = ROOT_DIR / "scripts" / "data" / "pokemon" / "download_gen1_4_sprites.py"

os.execv(sys.executable, [sys.executable, str(TARGET_SCRIPT), *sys.argv[1:]])
