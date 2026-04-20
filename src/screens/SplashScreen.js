import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Image } from 'react-native';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';

export function SplashScreen() {
  const { themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.blobA, { backgroundColor: colors.blobA }]} />
      <View style={[styles.blobB, { backgroundColor: colors.blobB }]} />

      <Animated.View style={[styles.center, { opacity: scale }]}>
        <Image
          source={require('../../frames/Gemini_Generated_Image___1_-removebg-preview.png')}
          style={styles.appLogo}
          resizeMode="contain"
        />

        <Image
          source={require('../../svgs/Untitled_design__3_-removebg-preview.png')}
          style={[
            styles.logo,
            {
              tintColor: themeMode === 'dark' ? '#FFF7E8' : undefined,
              opacity: themeMode === 'dark' ? 0.96 : 1,
            },
          ]}
          resizeMode="contain"
        />

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  blobA: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.22,
    top: -120,
    right: -70,
  },
  blobB: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.18,
    bottom: -90,
    left: -80,
  },
  center: {
    alignItems: 'center',
    gap: 0,
  },
  appLogo: {
    width: 142,
    height: 142,
    marginBottom: -20,
  },
  logo: {
    width: 330,
    height: 110,
    marginTop: -20,
  },
});
