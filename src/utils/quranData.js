export function buildQuranIndex(ayahRows) {
  const cleanRows = ayahRows
    .filter((row) => row && Number.isInteger(row.surah_number) && Number.isInteger(row.ayah_number))
    .sort(
      (a, b) =>
        a.surah_number - b.surah_number ||
        a.ayah_number - b.ayah_number ||
        (a.source_post_id || 0) - (b.source_post_id || 0)
    );

  const surahMap = new Map();
  const ayahsBySurah = {};
  const ayahByKey = {};

  for (const row of cleanRows) {
    if (!ayahsBySurah[row.surah_number]) ayahsBySurah[row.surah_number] = [];
    ayahsBySurah[row.surah_number].push(row);
    ayahByKey[`${row.surah_number}:${row.ayah_number}`] = row;

    if (!surahMap.has(row.surah_number)) {
      surahMap.set(row.surah_number, {
        surah_number: row.surah_number,
        surah_name: row.surah_name || `Surah ${row.surah_number}`,
        ayah_count: 0,
      });
    }
  }

  for (const [surahNo, rows] of Object.entries(ayahsBySurah)) {
    const surah = surahMap.get(Number(surahNo));
    if (surah) surah.ayah_count = rows.length;
  }

  // Keep Surah 1 visible in list even if data is not imported yet.
  if (!surahMap.has(1)) {
    surahMap.set(1, {
      surah_number: 1,
      surah_name: 'Al-Fatihah',
      ayah_count: 0,
    });
    ayahsBySurah[1] = [];
  }

  const surahs = Array.from(surahMap.values()).sort((a, b) => a.surah_number - b.surah_number);

  return { surahs, ayahsBySurah, ayahByKey };
}

export function filterSurahs(surahs, query) {
  const q = query.trim().toLowerCase();
  if (!q) return surahs;

  return surahs.filter(
    (s) => String(s.surah_number).includes(q) || (s.surah_name || '').toLowerCase().includes(q)
  );
}

export function filterAyahs(ayahs, query) {
  const q = query.trim().toLowerCase();
  if (!q) return ayahs;

  return ayahs.filter(
    (a) =>
      String(a.ayah_number).includes(q) ||
      (a.arabic_text || '').toLowerCase().includes(q) ||
      (a.translation || '').toLowerCase().includes(q) ||
      (a.tafseer || '').toLowerCase().includes(q)
  );
}
