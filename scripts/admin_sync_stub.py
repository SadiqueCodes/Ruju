"""
Admin sync stub for future panel integration.

Goal later:
- Receive uploaded JSON
- Normalize to ayah row schema
- Validate per-surah ayah ranges
- Save to ../ayahs_formatted.json
"""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "result.json"
OUTPUT = ROOT / "ayahs_formatted.json"


def main() -> None:
    if not INPUT.exists():
        raise SystemExit(f"Missing input file: {INPUT}")

    # Placeholder: replace with full normalization pipeline.
    # For now, just verifies output exists and prints status.
    if OUTPUT.exists():
        rows = json.loads(OUTPUT.read_text(encoding="utf-8"))
        print(f"Current dataset rows: {len(rows)}")
    else:
        print("No formatted dataset found yet.")


if __name__ == "__main__":
    main()
