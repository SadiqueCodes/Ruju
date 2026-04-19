import React, { useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';

import FlowerA from '../../frames/flower-svgrepo-com (3).svg';
import FlowerB from '../../frames/flower-svgrepo-com (4).svg';
import MoonSvg from '../../frames/moon-svgrepo-com.svg';
import SunSvg from '../../frames/sun-svgrepo-com.svg';

const STYLE_OPTIONS = [
  { id: 'flower', label: 'Flower', Icon: FlowerA },
  { id: 'floral', label: 'Floral', Icon: FlowerB },
  { id: 'moon', label: 'Moon', Icon: MoonSvg },
  { id: 'sun', label: 'Sun', Icon: SunSvg },
];

export function TasbeehScreen() {
  const { themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const [count, setCount] = useState(0);
  const [limitInput, setLimitInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0].id);
  const pressScale = useRef(new Animated.Value(1)).current;

  const limitValue = useMemo(() => {
    const parsed = Number(limitInput.replace(/[^0-9]/g, ''));
    return parsed > 0 ? parsed : null;
  }, [limitInput]);

  const displayCount = limitValue ? `${count} / ${limitValue}` : `${count}`;

  const activeStyle = STYLE_OPTIONS.find((option) => option.id === selectedStyle);

  const increment = () => {
    if (limitValue && count >= limitValue) return;
    setCount((prev) => prev + 1);
  };

  const reset = () => setCount(0);

  const onCounterPressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.96,
      tension: 220,
      friction: 16,
      useNativeDriver: true,
    }).start();
  };

  const onCounterPressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      tension: 180,
      friction: 14,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.countText, { color: colors.text }]}>{displayCount}</Text>
        <Pressable onPress={increment} onPressIn={onCounterPressIn} onPressOut={onCounterPressOut}>
          <Animated.View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowOpacity: isLight ? 0.12 : 0.25,
                transform: [{ scale: pressScale }],
              },
            ]}
          >
            <View style={styles.avatarInner}>
              {activeStyle?.Icon ? <activeStyle.Icon width={140} height={140} /> : null}
            </View>
          </Animated.View>
        </Pressable>

        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: 'height' })} style={styles.controls}>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={reset}
              style={[
                styles.actionButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="refresh" size={18} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Reset</Text>
            </Pressable>

            <TextInput
              value={limitInput}
              onChangeText={setLimitInput}
              placeholder="Limit (optional)"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={[
                styles.limitInput,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
            />
          </View>
        </KeyboardAvoidingView>

        <View style={styles.stylesRow}>
          <Text style={[styles.stylesLabel, { color: colors.muted }]}>Counter Style</Text>
          <View style={styles.styleChips}>
            {STYLE_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => setSelectedStyle(option.id)}
                style={[
                  styles.styleChip,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedStyle === option.id ? colors.gold : colors.border,
                  },
                ]}
              >
                <View style={styles.styleIconWrap}>
                  <option.Icon width={32} height={32} />
                </View>
                <Text
                  style={[
                    styles.styleLabel,
                    { color: selectedStyle === option.id ? colors.text : colors.muted },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 26,
  },
  countText: {
    fontSize: 68,
    fontWeight: '800',
    color: '#1D1D20',
    marginBottom: 8,
    marginTop: -4,
  },
  avatarCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 15 },
    elevation: 4,
    flexDirection: 'column',
    gap: 0,
    paddingTop: 0,
  },
  avatarInner: {
    width: 176,
    height: 176,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  controls: {
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 0.45,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  actionText: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  limitInput: {
    flex: 0.55,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontWeight: '600',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  stylesRow: {
    width: '100%',
    marginTop: 24,
  },
  stylesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5c5b66',
    marginBottom: 12,
  },
  styleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  styleChip: {
    width: 70,
    height: 90,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1.3,
  },
  styleIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
