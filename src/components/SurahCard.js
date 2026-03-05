import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { getThemeColors } from '../theme';
const FRAME_BACKGROUNDS = require('../../frames/geminiSlices');
const CARD_HEIGHT = 96;

export function SurahCard({ surah, onPress, themeMode = 'dark' }) {
  const colors = getThemeColors(themeMode);
  const normalizedIndex = (Number(surah?.surah_number || 1) - 1) % FRAME_BACKGROUNDS.length;
  const backgroundSource = FRAME_BACKGROUNDS[normalizedIndex];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderColor: isLightMode(themeMode) ? '#F0E9EC' : colors.border }]}
    >
      <ImageBackground source={backgroundSource} style={styles.bg} imageStyle={styles.bgImage}>
        <View style={styles.bgShade} />
        <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.95)' }]}>
          <Text style={[styles.badgeText, { color: '#7C4E2D' }]}>{surah.surah_number}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{surah.surah_name}</Text>
          <Text style={styles.meta}>{surah.ayah_count} ayahs</Text>
        </View>
        <View style={[styles.chevWrap, { backgroundColor: 'rgba(255,255,255,0.88)' }]}>
          <Text style={[styles.chev, { color: '#8F5F39' }]}>›</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const isLightMode = (mode) => mode === 'light';

const styles = StyleSheet.create({
  card: {
    borderRadius: 17,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  bg: {
    minHeight: CARD_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bgImage: {
    resizeMode: 'cover',
    borderRadius: 16,
  },
  bgShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 14,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  meta: {
    fontSize: 11,
    marginTop: 1,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.96)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.24)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1.5,
  },
  chevWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chev: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: -2,
  },
});
