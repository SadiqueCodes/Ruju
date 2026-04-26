import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';

export function SurahIntroductionCard({ surahNumber, surahName, introduction }) {
  const { themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';

  if (!String(introduction || '').trim()) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rowTop}>
        <Text style={[styles.kicker, { color: colors.gold }]}>Introduction</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{surahName || `Surah ${surahNumber}`}</Text>
      </View>
      <View style={[styles.section, { borderTopColor: isLight ? '#D9E2F0' : '#1D2941' }]}>
        <Text style={[styles.body, { color: colors.muted }]}>{String(introduction || '').trim()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
    gap: 10,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
});
