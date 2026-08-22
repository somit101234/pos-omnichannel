#!/usr/bin/env python3
from pathlib import Path

text = Path(".specify/contracts/electron-desktop-app.md").read_text()
for i, line in enumerate(text.splitlines(), 1):
    print(f"{i}: {line!r}")
