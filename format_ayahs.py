import json
import re
from pathlib import Path

INPUT = Path('result.json')
OUTPUT = Path('ayahs_formatted.json')

# Juz boundaries as (surah, ayah) start positions for Juz 1..30
JUZ_STARTS = [
    (1, 1), (2, 142), (2, 253), (3, 93), (4, 24), (4, 148), (5, 82), (6, 111), (7, 88), (8, 41),
    (9, 93), (11, 6), (12, 53), (15, 1), (17, 1), (18, 75), (21, 1), (23, 1), (25, 21), (27, 56),
    (29, 46), (33, 31), (36, 28), (39, 32), (41, 47), (46, 1), (51, 31), (58, 1), (67, 1), (78, 1),
]

SURAH_NAME_FALLBACK = {
    2: 'Al-Baqarah'
}

AYAH_HEADER_RE = re.compile(
    r'(?im)(?:^|\n)\s*[*_~\-\s]*A(?:a|y)ya?t\s*(?:No\.?|no\.?)\s*[:#-]?\s*(\d+)\s*[-:]*'
)

SURAH_NUM_RE = re.compile(
    r'(?i)\bSura(?:h|t)\b\s*(?:No\.?|number)?\s*[:#-]?\s*(\d+)'
)

SURAH_NAME_RE = re.compile(
    r'(?i)\bSura(?:h|t)\b[^\n\r:]*[:\-]?\s*(?:No\.?\s*\d+\s*[-ñ:]\s*)?([A-Za-z][A-Za-z\-\'\s]+)'
)

QUOTE_RE = re.compile(r'["ì](.+?)["î]', re.DOTALL)


def flatten_text(text_field):
    if isinstance(text_field, str):
        return text_field
    if isinstance(text_field, list):
        parts = []
        for part in text_field:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                t = part.get('text')
                if isinstance(t, str):
                    parts.append(t)
        return ''.join(parts)
    return ''


def normalize_surah_name(raw_name):
    if not raw_name:
        return None
    name = raw_name.strip().strip('*_"\'').strip()
    name = re.sub(r'\s+', ' ', name)
    name = name.replace('Al-baqarah', 'Al-Baqarah').replace('al-baqarah', 'Al-Baqarah')
    name = name.replace('baqrah', 'Baqarah')
    if name.lower() == 'baqarah':
        return 'Al-Baqarah'
    if name.lower().startswith('al-'):
        return name[:3] + name[3:].title()
    return name


def juz_number_for(surah, ayah):
    if not isinstance(surah, int) or not isinstance(ayah, int):
        return None
    current = 1
    for i, (s, a) in enumerate(JUZ_STARTS, start=1):
        if (surah, ayah) >= (s, a):
            current = i
        else:
            break
    return current


def clean_block(block):
    block = block.replace('\r\n', '\n').replace('\r', '\n')
    block = re.sub(r'\n{3,}', '\n\n', block)
    return block.strip()


def extract_arabic_line(block):
    lines = [ln.strip() for ln in block.split('\n') if ln.strip()]
    for ln in lines[:8]:
        # true Arabic range or common mojibake chars from mis-decoded Arabic
        if re.search(r'[\u0600-\u06FF]|[ÿŸ€]', ln):
            # avoid labels like Ayat no.
            if re.search(r'(?i)ayat|aayat|surah|surat', ln):
                continue
            return ln.strip('*_ -ï??\t')
    return ''


def parse_message(message, last_surah_num=None, last_surah_name=None):
    text = flatten_text(message.get('text', ''))
    if not text:
        return [], last_surah_num, last_surah_name

    text = text.replace('\r\n', '\n').replace('\r', '\n')

    surah_num_match = SURAH_NUM_RE.search(text)
    if surah_num_match:
        last_surah_num = int(surah_num_match.group(1))

    surah_name_match = SURAH_NAME_RE.search(text)
    if surah_name_match:
        candidate = normalize_surah_name(surah_name_match.group(1))
        if candidate and len(candidate) < 60:
            last_surah_name = candidate

    if last_surah_num in SURAH_NAME_FALLBACK and (not last_surah_name or len(last_surah_name) < 3):
        last_surah_name = SURAH_NAME_FALLBACK[last_surah_num]

    ayah_headers = list(AYAH_HEADER_RE.finditer(text))
    if not ayah_headers:
        return [], last_surah_num, last_surah_name

    records = []

    for idx, m in enumerate(ayah_headers):
        ayah_num = int(m.group(1))
        start = m.end()
        end = ayah_headers[idx + 1].start() if idx + 1 < len(ayah_headers) else len(text)
        section = clean_block(text[start:end])
        if not section:
            continue

        arabic_text = extract_arabic_line(section)
        quote_match = QUOTE_RE.search(section)
        translation = quote_match.group(1).strip() if quote_match else ''

        tafseer = section
        if arabic_text:
            tafseer = tafseer.replace(arabic_text, '', 1)
        if translation:
            tafseer = tafseer.replace(quote_match.group(0), '', 1)
        tafseer = clean_block(tafseer)

        record = {
            'surah_number': last_surah_num,
            'surah_name': last_surah_name,
            'juz_number': juz_number_for(last_surah_num, ayah_num) if last_surah_num else None,
            'ayah_number': ayah_num,
            'arabic_text': arabic_text,
            'translation': translation,
            'tafseer': tafseer,
            'source_post_id': message.get('id'),
        }
        records.append(record)

    return records, last_surah_num, last_surah_name


def main():
    data = json.loads(INPUT.read_text(encoding='utf-8'))
    messages = data.get('messages', [])

    all_records = []
    last_surah_num = None
    last_surah_name = None

    for msg in messages:
        if msg.get('type') != 'message':
            continue
        parsed, last_surah_num, last_surah_name = parse_message(msg, last_surah_num, last_surah_name)
        all_records.extend(parsed)

    OUTPUT.write_text(json.dumps(all_records, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Wrote {len(all_records)} ayah records to {OUTPUT}')


if __name__ == '__main__':
    main()
