import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export function SurahCard({ surah, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{surah.surah_number}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{surah.surah_name}</Text>
        <Text style={styles.meta}>{surah.ayah_count} ayahs</Text>
      </View>

      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1C2740',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.gold,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
  meta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  chev: {
    color: COLORS.muted,
    fontSize: 22,
    fontWeight: '600',
  },
});
