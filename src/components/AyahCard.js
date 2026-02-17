import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export function AyahCard({ ayah, bookmarked, onToggleBookmark, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.ayahNo}>Ayah {ayah.ayah_number}</Text>
        <View style={styles.rowRight}>
          <Text style={styles.juz}>Juz {ayah.juz_number || '-'}</Text>
          {onToggleBookmark ? (
            <Pressable onPress={onToggleBookmark} style={[styles.saveBtn, bookmarked && styles.saveBtnActive]}>
              <Text style={[styles.saveText, bookmarked && styles.saveTextActive]}>{bookmarked ? 'Saved' : 'Save'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {!!ayah.arabic_text && <Text style={styles.arabic}>{ayah.arabic_text}</Text>}
      {!!ayah.translation && <Text style={styles.translation}>{ayah.translation}</Text>}
      {!!ayah.tafseer && <Text style={styles.tafseer}>{ayah.tafseer}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
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
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  juz: {
    color: COLORS.muted,
    fontSize: 12,
  },
  saveBtn: {
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#101829',
  },
  saveBtnActive: {
    borderColor: COLORS.gold,
    backgroundColor: '#221A0C',
  },
  saveText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  saveTextActive: {
    color: COLORS.gold,
  },
  arabic: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 40,
    textAlign: 'right',
  },
  translation: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  tafseer: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
