#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse
import json
import re
from pathlib import Path

JUZ_STARTS = [
    (1, 1), (2, 142), (2, 253), (3, 93), (4, 24), (4, 148), (5, 82), (6, 111), (7, 88), (8, 41),
    (9, 93), (11, 6), (12, 53), (15, 1), (17, 1), (18, 75), (21, 1), (23, 1), (25, 21), (27, 56),
    (29, 46), (33, 31), (36, 28), (39, 32), (41, 47), (46, 1), (51, 31), (58, 1), (67, 1), (78, 1),
]

SURAH_AYAH_MAX = {
    1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109, 11: 123, 12: 111,
    13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135, 21: 112, 22: 78, 23: 118,
    24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60, 31: 34, 32: 30, 33: 73, 34: 54, 35: 45,
    36: 83, 37: 182, 38: 88, 39: 75, 40: 85, 41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38,
    48: 29, 49: 18, 50: 45, 51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24,
    60: 13, 61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44, 71: 28,
    72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42, 81: 29, 82: 19, 83: 36,
    84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20, 91: 15, 92: 21, 93: 11, 94: 8, 95: 8,
    96: 19, 97: 5, 98: 8, 99: 8, 100: 11, 101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7,
    108: 3, 109: 6, 110: 3, 111: 5, 112: 4, 113: 5, 114: 6,
}

DIGIT_MAP = str.maketrans({
    "\u06f0": "0", "\u06f1": "1", "\u06f2": "2", "\u06f3": "3", "\u06f4": "4",
    "\u06f5": "5", "\u06f6": "6", "\u06f7": "7", "\u06f8": "8", "\u06f9": "9",
    "\u0660": "0", "\u0661": "1", "\u0662": "2", "\u0663": "3", "\u0664": "4",
    "\u0665": "5", "\u0666": "6", "\u0667": "7", "\u0668": "8", "\u0669": "9",
})

RX_SURAH = re.compile(
    r"(?im)^\s*[^A-Za-z0-9\r\n]{0,30}\s*[*_~\-\s]*Sura(?:h|t)\s*(?:No\.?|number)?\s*[:#-]?\s*([0-9\u06f0-\u06f9\u0660-\u0669]+)\s*[-,:]?\s*([A-Za-z][A-Za-z'\-\s]+)?"
)
RX_AYAH = re.compile(
    r"(?im)A(?:a)?y(?:a)?t?\s*(?:No\.?|no\.?)\s*[:#-]?\s*([0-9\u06f0-\u06f9\u0660-\u0669]+)\s*(?:[-]\s*([0-9\u06f0-\u06f9\u0660-\u0669]+))?"
)
RX_QUOTE = re.compile(r'[\"]([\s\S]+?)[\"]')


def normalize_digits(value: str) -> str:
    return (value or "").translate(DIGIT_MAP)


def clean_text(value: str) -> str:
    value = (value or "").replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def normalize_tafseer_flow(value: str) -> str:
    text = clean_text(value)
    if not text:
        return ""

    raw_lines = [line.rstrip() for line in text.split("\n")]
    paragraphs: list[str] = []
    current: list[str] = []

    bullet_start = re.compile(r"^\s*([🔸🔹🔺🔻🔅🔆📖📚♦️❇️⭐🌸🌼🌷•▪\-]|\d+\.)")
    sentence_end = re.compile(r"[.!?۔؟:;*]$|[\)\]\}][.!?۔؟:;]?$")
    protected_line = re.compile(r"^\s*(📖|📚|{.*}|[\[\(].*[\]\)]\s*$)")
    continuation_marker = re.compile(
        r"(?i)\b(to\s*be\s*continued|description\s*part\s*\d+|part\s*\d+\s*description|in\s*shaa?\s*allah.*next\s*post)\b"
    )

    def flush_current() -> None:
        if not current:
            return
        paragraphs.append(" ".join(part.strip() for part in current if part.strip()))
        current.clear()

    for raw in raw_lines:
        line = raw.strip()
        if not line:
            flush_current()
            continue

        # Drop cross-post continuation markers from final tafseer body.
        if continuation_marker.search(line):
            flush_current()
            continue

        if not current:
            current.append(line)
            continue

        prev = current[-1].strip()

        if bullet_start.match(line) or protected_line.match(line):
            flush_current()
            current.append(line)
            continue

        if sentence_end.search(prev):
            flush_current()
            current.append(line)
            continue

        # Continue the same sentence across wrapped Telegram lines.
        current[-1] = f"{prev} {line}".strip()

    flush_current()
    return clean_text("\n\n".join(paragraphs))


def flatten_text(text_value) -> str:
    if isinstance(text_value, str):
        return text_value
    if isinstance(text_value, list):
        parts = []
        for item in text_value:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
        return "".join(parts)
    if isinstance(text_value, dict) and isinstance(text_value.get("text"), str):
        return text_value["text"]
    return ""


def get_juz(surah: int, ayah: int) -> int:
    current = 1
    for idx, (s, a) in enumerate(JUZ_STARTS, start=1):
        if surah > s or (surah == s and ayah >= a):
            current = idx
        else:
            break
    return current


def canonical_surah_name(raw_name: str, surah_number: int) -> str:
    name = re.sub(r"\s+", " ", (raw_name or "")).strip(" *_'\",-")
    if re.match(r"(?i)^al[-\s]?baqrah$|^al[-\s]?baqarah$|^baqarah$|^baqrah$", name):
        return "Al-Baqarah"
    return name or f"Surah {surah_number}"


def is_valid_ayah_header(text: str, match: re.Match) -> bool:
    line_start = text.rfind("\n", 0, match.start())
    line_start = 0 if line_start < 0 else line_start + 1
    prefix = text[line_start:match.start()]
    return re.search(r"[A-Za-z0-9]", prefix) is None


def is_primary_arabic_line(line: str) -> bool:
    text = (line or "").strip()
    if not text:
        return False
    if re.search(r"[A-Za-z]", text):
        return False
    arabic_chars = re.findall(r"[\u0600-\u06FF]", text)
    return len(arabic_chars) >= 6


def extract_arabic_lines(section: str) -> list[str]:
    lines = []
    for raw_line in section.split("\n"):
        line = raw_line.strip()
        if not line:
            continue
        if re.search(r"(?i)ayat|aayat|surah|surat", line):
            continue
        if is_primary_arabic_line(line):
            cleaned = line.strip("*_ -•▪️\t")
            if cleaned:
                lines.append(cleaned)
    return lines


def extract_translations(section: str) -> tuple[list[str], list[str]]:
    translations: list[str] = []
    removals: list[str] = []
    seen: set[str] = set()

    patterns = [
        re.compile(r'["“]([^"\n”]{15,})["”]'),
        re.compile(r'_([^_\n]{15,})_'),
    ]

    for pattern in patterns:
        for match in pattern.finditer(section):
            candidate = clean_text(match.group(1))
            if not candidate:
                continue
            key = re.sub(r"\s+", " ", candidate).lower()
            if key in seen:
                continue
            seen.add(key)
            translations.append(candidate)
            removals.append(match.group(0))

    # Intentionally avoid a generic fallback that grabs the first long non-Arabic line.
    # That fallback can consume explanatory tafseer lines (e.g. word-meaning notes).

    return translations, removals


def record_quality(row: dict) -> int:
    score = 0
    if (row.get("arabic_text") or "").strip():
        score += 2
    if (row.get("translation") or "").strip():
        score += 2
    if (row.get("tafseer") or "").strip():
        score += 1
    return score


def _norm_compare_text(value: str) -> str:
    return re.sub(r"\s+", " ", clean_text(value)).strip().lower()


def _pick_richer_text(first: str, second: str) -> str:
    a = clean_text(first)
    b = clean_text(second)
    if not a:
        return b
    if not b:
        return a
    a_norm = _norm_compare_text(a)
    b_norm = _norm_compare_text(b)
    if a_norm == b_norm:
        return a if len(a) >= len(b) else b
    if a_norm in b_norm:
        return b
    if b_norm in a_norm:
        return a
    return a if len(a) >= len(b) else b


def _append_unique_tafseer(existing_tafseer: str, new_tafseer: str, same_source: bool) -> str:
    a = normalize_tafseer_flow(existing_tafseer)
    b = normalize_tafseer_flow(new_tafseer)
    if not a:
        return b
    if not b:
        return a

    a_norm = _norm_compare_text(a)
    b_norm = _norm_compare_text(b)

    if a_norm == b_norm:
        return a if len(a) >= len(b) else b
    if a_norm in b_norm:
        return b
    if b_norm in a_norm:
        return a

    # For duplicate parses from the same source post, avoid noisy concatenation.
    if same_source:
        return a if len(a) >= len(b) else b

    return normalize_tafseer_flow(f"{a}\n\n{b}")


def merge_rows(existing: dict, candidate: dict) -> dict:
    existing_source = existing.get("source_post_id")
    candidate_source = candidate.get("source_post_id")
    same_source = (
        existing_source is not None
        and candidate_source is not None
        and str(existing_source) == str(candidate_source)
    )

    merged = dict(existing)
    merged["surah_name"] = existing.get("surah_name") or candidate.get("surah_name") or existing.get("surah_name")
    merged["juz_number"] = existing.get("juz_number") or candidate.get("juz_number")
    merged["arabic_text"] = _pick_richer_text(existing.get("arabic_text", ""), candidate.get("arabic_text", ""))
    merged["translation"] = _pick_richer_text(existing.get("translation", ""), candidate.get("translation", ""))

    # Preserve chronological flow when appending continuation tafseer across posts.
    if not same_source:
        if isinstance(existing_source, int) and isinstance(candidate_source, int) and candidate_source < existing_source:
            first_tafseer = candidate.get("tafseer", "")
            second_tafseer = existing.get("tafseer", "")
        else:
            first_tafseer = existing.get("tafseer", "")
            second_tafseer = candidate.get("tafseer", "")
        merged["tafseer"] = _append_unique_tafseer(first_tafseer, second_tafseer, same_source=False)
    else:
        merged["tafseer"] = _append_unique_tafseer(
            existing.get("tafseer", ""),
            candidate.get("tafseer", ""),
            same_source=True,
        )

    # Keep earliest source post id for traceability of first capture.
    if isinstance(existing_source, int) and isinstance(candidate_source, int):
        merged["source_post_id"] = min(existing_source, candidate_source)
    else:
        merged["source_post_id"] = existing_source or candidate_source

    return merged


def build_records(payload: dict) -> tuple[list[dict], dict]:
    messages = payload.get("messages", [])
    records = {}
    current_surah = None
    current_name = None

    scanned_messages = 0
    parsed_message_blocks = 0

    for msg in messages:
        if msg.get("type") != "message":
            continue

        scanned_messages += 1
        text = flatten_text(msg.get("text"))
        if not text:
            continue
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        surah_match = RX_SURAH.search(text)
        if surah_match:
            surah_text = normalize_digits(surah_match.group(1) or "")
            if surah_text.isdigit():
                surah_num = int(surah_text)
                if 1 <= surah_num <= 114:
                    current_surah = surah_num
                    current_name = canonical_surah_name(surah_match.group(2), surah_num)
        elif current_surah is None and re.search(r"(?i)surah\s+.*(baqarah|baqrah)", text):
            current_surah = 2
            current_name = "Al-Baqarah"

        if not current_surah:
            continue

        ayah_matches = [m for m in RX_AYAH.finditer(text) if is_valid_ayah_header(text, m)]
        if not ayah_matches:
            continue

        parsed_message_blocks += 1

        for idx, match in enumerate(ayah_matches):
            start_ayah_text = normalize_digits(match.group(1) or "")
            if not start_ayah_text.isdigit():
                continue

            start_ayah = int(start_ayah_text)
            max_ayah = SURAH_AYAH_MAX.get(current_surah)
            if not max_ayah or not (1 <= start_ayah <= max_ayah):
                continue

            ayah_numbers = [start_ayah]
            end_ayah_text = normalize_digits(match.group(2) or "")
            if end_ayah_text.isdigit():
                end_ayah = int(end_ayah_text)
                if start_ayah <= end_ayah <= max_ayah and (end_ayah - start_ayah) <= 10:
                    ayah_numbers.extend(range(start_ayah + 1, end_ayah + 1))

            section_start = match.end()
            section_end = ayah_matches[idx + 1].start() if idx < len(ayah_matches) - 1 else len(text)
            if section_end <= section_start:
                continue

            section = clean_text(text[section_start:section_end])
            if not section:
                continue

            arabic_lines = extract_arabic_lines(section)
            has_primary_arabic = len(arabic_lines) > 0
            if has_primary_arabic:
                translations, translation_spans = extract_translations(section)
            else:
                translations, translation_spans = [], []

            tafseer = section
            # Remove only the primary ayah Arabic lines, not every Arabic-script line.
            # This preserves glossary/meaning fragments inside tafseer.
            arabic_spans_to_remove = min(len(arabic_lines), len(ayah_numbers))
            for arab_line in arabic_lines[:arabic_spans_to_remove]:
                tafseer = re.sub(re.escape(arab_line), "", tafseer, count=1)
            # Only remove the leading translation span(s) mapped to this ayah block.
            # Keep later quoted/underscored lines as part of tafseer (e.g. reference quotes).
            if has_primary_arabic:
                spans_to_remove = min(len(translation_spans), len(ayah_numbers))
                for span in translation_spans[:spans_to_remove]:
                    tafseer = re.sub(re.escape(span), "", tafseer, count=1)
            tafseer = normalize_tafseer_flow(tafseer)

            for i, ayah_number in enumerate(ayah_numbers):
                key = f"{current_surah}|{ayah_number}"
                candidate = {
                    "surah_number": current_surah,
                    "surah_name": current_name or f"Surah {current_surah}",
                    "juz_number": get_juz(current_surah, ayah_number),
                    "ayah_number": ayah_number,
                    "arabic_text": arabic_lines[i] if i < len(arabic_lines) else "",
                    "translation": translations[i] if i < len(translations) else "",
                    "tafseer": tafseer,
                    "source_post_id": msg.get("id"),
                }

                existing = records.get(key)
                if not existing:
                    records[key] = candidate
                    continue

                # Merge duplicates across continuation posts and richer re-parses.
                records[key] = merge_rows(existing, candidate)

    rows = sorted(records.values(), key=lambda item: (item["surah_number"], item["ayah_number"], item.get("source_post_id") or 0))

    by_surah = {}
    for row in rows:
        by_surah.setdefault(row["surah_number"], []).append(row["ayah_number"])

    summary = {}
    for surah, ayahs in by_surah.items():
        max_ayah = SURAH_AYAH_MAX.get(surah, max(ayahs))
        ayah_set = set(ayahs)
        missing = [a for a in range(1, max_ayah + 1) if a not in ayah_set]
        summary[surah] = {
            "count": len(ayahs),
            "min_ayah": min(ayahs),
            "max_ayah": max(ayahs),
            "missing_count": len(missing),
            "first_missing_preview": missing[:20],
        }

    report = {
        "rows_written": len(rows),
        "surah_count": len(summary),
        "surah_min": min(summary) if summary else None,
        "surah_max": max(summary) if summary else None,
        "messages_scanned": scanned_messages,
        "messages_with_ayah_blocks": parsed_message_blocks,
        "surah_summary": summary,
    }

    return rows, report


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize Telegram Quran posts into ayah rows.")
    parser.add_argument("--input", default="result.json", help="Path to Telegram export JSON")
    parser.add_argument("--output", default="ayahs_formatted.json", help="Path to output ayah rows JSON")
    parser.add_argument("--report", default="scripts/sync_report.json", help="Path to validation report JSON")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    report_path = Path(args.report)

    payload = json.loads(input_path.read_text(encoding="utf-8"))
    rows, report = build_records(payload)

    output_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote {len(rows)} rows to {output_path}")
    print(f"Validation report written to {report_path}")


if __name__ == "__main__":
    main()
