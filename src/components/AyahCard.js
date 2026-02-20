import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getThemeColors } from '../theme';
import { cleanArabicText, cleanBodyText } from '../utils/textCleaner';
import { useAppState } from '../state/AppState';

function normalizeBodyDisplay(value) {
  let text = String(value || '')
    .replace(/^\s+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  let changed = true;
  while (changed) {
    changed = false;
    const next = text
      .replace(/^_([\s\S]*?)_$/g, '$1')
      .replace(/^\*([\s\S]*?)\*$/g, '$1')
      .replace(/^"([\s\S]*?)"$/g, '$1')
      .trim();
    if (next !== text) {
      text = next;
      changed = true;
    }
  }

  return text;
}

function normalizeTafseerDisplay(value) {
  const text = normalizeBodyDisplay(value);
  if (!text) return '';

  const lines = text.split('\n');
  let start = 0;

  while (start < lines.length) {
    const line = lines[start].trim();
    if (!line) {
      start += 1;
      continue;
    }

    const hasRealText = /[A-Za-z0-9\u0600-\u06FF]/.test(line);
    if (hasRealText) break;
    start += 1;
  }

  const isDecorativeOnly = (line) => {
    const compact = line.replace(/\s+/g, '');
    if (!compact) return true;
    if (!/[A-Za-z0-9\u0600-\u06FF]/.test(compact)) return true;
    if (/^[_\-–—=~*#•▪◾◼◆◇●○▶►■□✦✧★☆]+$/.test(compact)) return true;
    return false;
  };

  const cleanLines = lines
    .slice(start)
    .map((line) =>
      line
        .replace(/^[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g, '')
        .replace(/\s+$/g, '')
    )
    .map((line) => line.replace(/^\s*[-–—_]+\s*/g, ''))
    .map((line) => line.replace(/\s*[-–—_]+\s*$/g, ''))
    .map((line) => line.replace(/^\s*[*_]+\s*/g, ''))
    .map((line) => line.replace(/\s*[*_]+\s*$/g, ''))
    .map((line) => line.replace(/^\s*[▪▫◾◼■□◆◇◽◻]+\s*/g, ''))
    .map((line) => line.replace(/^\s*[▪▫◾◼■□◆◇◽◻]️\s*/g, ''))
    .map((line) => line.replace(/^\s*\*+\s*/g, '*'))
    .map((line) => line.replace(/^\[\s*\*+\s*/g, '[*'))
    .map((line) => line.replace(/^\*+\s+/g, (m) => m.trimEnd()))
    .map((line) => line.replace(/\s*\*+\s*\]$/g, '*]'))
    .map((line) => line.trim())
    .filter((line) => !isDecorativeOnly(line))
    .filter(Boolean);

  const capitalizeParagraphStart = (line) =>
    line.replace(/^([^A-Za-z]*)([a-z])/, (_, prefix, first) => `${prefix}${first.toUpperCase()}`);

  return cleanLines
    .map(capitalizeParagraphStart)
    .join('\n\n')
    .trim();
}

function extractTopTranslationCandidate(tafseerRaw) {
  const lines = String(tafseerRaw || '').split('\n');
  let candidateIndex = -1;
  let candidateText = '';

  let inspected = 0;
  for (let i = 0; i < lines.length && inspected < 8; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    inspected += 1;

    if (/^[🔸🔹🔺🔻🔅🔆📖📚♦️❇️⭐🌸🌼🌷]/u.test(line)) continue;
    if (/^\[?\s*\*?\s*Surah\b/i.test(line)) continue;

    const wrapped = line.match(/^_([^_\n]{15,})_$/) || line.match(/^["“]([^"\n”]{15,})["”]$/);
    if (!wrapped || !wrapped[1]) continue;

    candidateIndex = i;
    candidateText = normalizeBodyDisplay(cleanBodyText(wrapped[1]));
    if (candidateText) break;
  }

  if (candidateIndex < 0 || !candidateText) return null;
  return { candidateIndex, candidateText };
}

function deriveTranslationAndTafseer(ayah) {
  const direct = normalizeBodyDisplay(cleanBodyText(ayah.translation));
  const tafseerRaw = String(ayah.tafseer || '');

  if (direct) {
    return {
      translationText: direct,
      tafseerText: normalizeTafseerDisplay(cleanBodyText(tafseerRaw)),
    };
  }

  if (!tafseerRaw.trim()) {
    return {
      translationText: '',
      tafseerText: '',
    };
  }

  const extracted = extractTopTranslationCandidate(tafseerRaw);
  if (extracted) {
    const tafseerLines = tafseerRaw.split('\n');
    tafseerLines[extracted.candidateIndex] = '';
    const tafseerWithoutTranslation = normalizeBodyDisplay(cleanBodyText(tafseerLines.join('\n')));
    return {
      translationText: extracted.candidateText,
      tafseerText: normalizeTafseerDisplay(tafseerWithoutTranslation),
    };
  }

  return {
    translationText: '',
    tafseerText: normalizeTafseerDisplay(cleanBodyText(tafseerRaw)),
  };
}

export function AyahCard({ ayah, bookmarked, onToggleBookmark, onPress }) {
  const { themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';

  const arabicText = cleanArabicText(ayah.arabic_text);
  const { translationText, tafseerText } = deriveTranslationAndTafseer(ayah);

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={styles.rowTop}>
        <Text style={[styles.ayahNo, { color: colors.gold }]}>Ayah {ayah.ayah_number}</Text>
        <View style={styles.rowRight}>
          <Text style={[styles.juz, { color: colors.muted }]}>Juz {ayah.juz_number || '-'}</Text>
          {onToggleBookmark ? (
            <Pressable
              onPress={onToggleBookmark}
              style={[
                styles.saveBtn,
                { borderColor: colors.border, backgroundColor: isLight ? '#EEF3FF' : '#101829' },
                bookmarked && { borderColor: colors.gold, backgroundColor: isLight ? '#FFF3DA' : '#221A0C' },
              ]}
            >
              <Text style={[styles.saveText, { color: bookmarked ? colors.gold : colors.text }]}>{bookmarked ? 'Saved' : 'Save'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={[styles.section, { borderTopColor: isLight ? '#D9E2F0' : '#1D2941' }]}> 
        <Text style={[styles.label, { color: colors.accent }]}>Arabic</Text>
        {arabicText ? <Text style={[styles.arabic, { color: isLight ? '#1B2435' : '#FFFFFF' }]}>{arabicText}</Text> : <Text style={[styles.placeholder, { color: isLight ? '#6E7993' : '#7D89A6' }]}>Arabic text not available yet.</Text>}
      </View>

      <View style={[styles.section, { borderTopColor: isLight ? '#D9E2F0' : '#1D2941' }]}> 
        <Text style={[styles.label, { color: colors.accent }]}>Translation</Text>
        {translationText ? <Text style={[styles.translation, { color: colors.text }]}>{translationText}</Text> : <Text style={[styles.placeholder, { color: isLight ? '#6E7993' : '#7D89A6' }]}>Translation not available yet.</Text>}
      </View>

      <View style={[styles.section, { borderTopColor: isLight ? '#D9E2F0' : '#1D2941' }]}> 
        <Text style={[styles.label, { color: colors.accent }]}>Tafseer</Text>
        {tafseerText ? <Text style={[styles.tafseer, { color: colors.muted }]}>{tafseerText}</Text> : <Text style={[styles.placeholder, { color: isLight ? '#6E7993' : '#7D89A6' }]}>Tafseer not available yet.</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    gap: 12,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ayahNo: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  juz: {
    fontSize: 12,
  },
  saveBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  saveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  arabic: {
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'right',
  },
  translation: {
    fontSize: 15,
    lineHeight: 23,
  },
  tafseer: {
    fontSize: 14,
    lineHeight: 21,
  },
  placeholder: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
