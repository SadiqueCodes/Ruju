import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  return (
    <View style={styles.root}>
      <View style={styles.blobA} />
      <View style={styles.blobB} />
      <Animated.View style={[styles.center, { opacity: fade, transform: [{ scale }] }]}>
        <Text style={styles.kicker}>Ruju</Text>
        <Text style={styles.title}>Quran</Text>
        <Text style={styles.sub}>Read. Reflect. Return.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobA: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.blobA,
    opacity: 0.22,
    top: -120,
    right: -70,
  },
  blobB: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.blobB,
    opacity: 0.18,
    bottom: -90,
    left: -80,
  },
  center: {
    alignItems: 'center',
  },
  kicker: {
    color: COLORS.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 46,
    fontWeight: '900',
    marginTop: 2,
  },
  sub: {
    color: COLORS.muted,
    marginTop: 6,
    fontSize: 14,
  },
});
