import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../state/AppState';
import { getThemeColors } from '../theme';

function makeStyles(colors, isLight) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30, gap: 10 },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      backgroundColor: colors.card,
      gap: 8,
    },
    title: { color: colors.text, fontSize: 18, fontWeight: '800' },
    body: { color: colors.text, fontSize: 14, lineHeight: 21 },
    hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  });
}

export function AboutScreen() {
  const { themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const styles = useMemo(() => makeStyles(colors, isLight), [colors, isLight]);

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Ruju Quran</Text>
          <Text style={styles.body}>Read ayas, tafseer and post.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Developed By</Text>
          <Text style={styles.body}>Zainab Ansari</Text>
          <Text style={styles.body}>Mohd Sadique Ali</Text>
          <Text style={styles.hint}>You can add more project details here later.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
