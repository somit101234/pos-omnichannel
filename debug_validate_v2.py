#!/usr/bin/env python3
from pathlib import Path

REQUIRED_SECTIONS = {
    "actor": ("ACTOR",),
    "precondition": ("PRECONDITION", "FIXTURE"),
    "success_state": ("SUCCESS STATE", "SUCCESS"),
    "empty_state": ("EMPTY STATE", "INTENTIONAL EMPTY", "EMPTY"),
    "error_state": ("ERROR STATE", "EXPECTED ERROR", "ERROR"),
    "primary_interaction": ("PRIMARY INTERACTION", "INTERACTION"),
    "negative_oracle": ("NEGATIVE ORACLE", "NEGATIVE"),
}

def _label_of(line):
    head = line.lstrip().lstrip("#*->").lstrip()
    upper = head.upper()
    for section, labels in REQUIRED_SECTIONS.items():
        for label in labels:
            if not upper.startswith(label):
                continue
            rest = head[len(label):].lstrip().lstrip("*").lstrip()
            if rest.startswith(":"):
                return section, rest[1:].strip().strip("*").strip()
            return section, rest
    return None, ""

text = Path(".specify/contracts/electron-desktop-app.md").read_text()
found = {}
current = None
for line in text.splitlines():
    section, rest = _label_of(line)
    print(f"line={line!r}, section={section}, rest={rest!r}")
    if section is not None:
        current = section
        found.setdefault(section, [])
        if rest:
            found[section].append(rest)
        continue
    if current and line.strip():
        found[current].append(line.strip())

print("\n=== Found sections ===")
for k, v in found.items():
    print(f"{k}: {v[:2]}")

print("\n=== Missing sections ===")
missing = []
for section in REQUIRED_SECTIONS:
    body = " ".join(found.get(section, [])).strip()
    norm = " ".join(body.lower().split()).strip(" .:;-")
    print(f"{section}: body={body[:30]!r}, norm={norm!r}, len={len(norm)}")
    if not norm or len(norm) < 8:
        missing.append(section)
print("Missing:", missing)
