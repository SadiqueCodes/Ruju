import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
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

import Panda from '../../frames/panda-svgrepo-com.svg';
import FlowerA from '../../frames/flower-svgrepo-com (3).svg';
import FlowerB from '../../frames/flower-svgrepo-com (4).svg';
import ManB from '../../frames/man-muslim-svgrepo-com (3).svg';

const STYLE_OPTIONS = [
  { id: 'panda', label: 'Panda', Icon: Panda },
  { id: 'cute', label: 'Cute', Icon: ManB },
  { id: 'flower', label: 'Flower', Icon: FlowerA },
  { id: 'floral', label: 'Floral', Icon: FlowerB },
];

export function TasbeehScreen() {
  const [count, setCount] = useState(0);
  const [limitInput, setLimitInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0].id);

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#F6F5F8' }]}>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.countText}>{displayCount}</Text>
        <Pressable
          onPress={increment}
          style={({ pressed }) => [
            styles.avatarCircle,
            pressed ? styles.avatarCirclePressed : null,
          ]}
        >
          <View style={styles.avatarInner}>
            {activeStyle?.Icon ? <activeStyle.Icon width={140} height={140} /> : null}
          </View>
        </Pressable>

        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: 'height' })} style={styles.controls}>
          <View style={styles.actionsRow}>
            <Pressable onPress={reset} style={styles.actionButton}>
              <Ionicons name="refresh" size={18} color="#1F1F1F" />
              <Text style={styles.actionText}>Reset</Text>
            </Pressable>

            <TextInput
              value={limitInput}
              onChangeText={setLimitInput}
              placeholder="Limit (optional)"
              placeholderTextColor="#9D9AA9"
              keyboardType="number-pad"
              style={styles.limitInput}
            />
          </View>
        </KeyboardAvoidingView>

        <View style={styles.stylesRow}>
          <Text style={styles.stylesLabel}>Counter Style</Text>
          <View style={styles.styleChips}>
            {STYLE_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => setSelectedStyle(option.id)}
                style={[
                  styles.styleChip,
                  selectedStyle === option.id ? styles.styleChipActive : styles.styleChipInactive,
                ]}
              >
                <View style={styles.styleIconWrap}>
                  <option.Icon width={32} height={32} />
                </View>
                <Text
                  style={[
                    styles.styleLabel,
                    selectedStyle === option.id ? styles.styleLabelActive : styles.styleLabelInactive,
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
    fontSize: 78,
    fontWeight: '800',
    color: '#1D1D20',
    marginBottom: 12,
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
    gap: 4,
    paddingTop: 16,
  },
  avatarCirclePressed: {
    transform: [{ scale: 0.96 }],
  },
  avatarInner: {
    width: 176,
    height: 176,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#fff',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
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
    justifyContent: 'space-between',
  },
  styleChip: {
    width: 70,
    height: 90,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderWidth: 1.3,
  },
  styleChipActive: {
    borderColor: '#cfa65f',
  },
  styleChipInactive: {
    borderColor: '#e3e1e7',
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
  styleLabelActive: {
    color: '#1c1c20',
  },
  styleLabelInactive: {
    color: '#9d9aa9',
  },
});
