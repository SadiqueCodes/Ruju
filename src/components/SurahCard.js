import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getThemeColors } from '../theme';

export function SurahCard({ surah, onPress, themeMode = 'dark' }) {
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.badge, { backgroundColor: isLight ? '#EEF3FF' : '#1C2740' }]}>
        <Text style={[styles.badgeText, { color: colors.gold }]}>{surah.surah_number}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{surah.surah_name}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{surah.ayah_count} ayahs</Text>
      </View>

      <Text style={[styles.chev, { color: colors.muted }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  chev: {
    fontSize: 22,
    fontWeight: '600',
  },
});
