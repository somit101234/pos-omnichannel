#!/usr/bin/env python3
# Debug _label_of function

line = "ACTOR"
head = line.lstrip().lstrip("#*->").lstrip()
upper = head.upper()
print(f"line={line!r}, head={head!r}, upper={upper!r}")

# Check startswith
print(f"upper.startswith('ACTOR') = {upper.startswith('ACTOR')}")

# Simulate full logic
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

for section, labels in REQUIRED_SECTIONS.items():
    for label in labels:
        if not upper.startswith(label):
            continue
        rest = head[len(label):].lstrip().lstrip("*").lstrip()
        if rest.startswith(":"):
            print(f"Match! section={section}, rest={rest!r}")
            continue
        print(f"Match! section={section}, rest={rest!r} (no colon)")
        break
