import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAppState } from '../state/AppState';
import { isSupabaseConfigured } from '../lib/supabase';

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function SettingsScreen() {
  const { surahs, bookmarkedAyahs, lastRead, clearBookmarks, clearLastRead, profileName, setProfileName } = useAppState();
  const [draftName, setDraftName] = useState(profileName || '');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <Text style={styles.heading}>Settings</Text>

        <View style={styles.row}>
          <StatCard label="Surahs Loaded" value={String(surahs.length)} />
          <StatCard label="Bookmarked Ayahs" value={String(bookmarkedAyahs.length)} />
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Last Read</Text>
          <Text style={styles.blockValue}>
            {lastRead
              ? `${lastRead.surah_name} - Ayah ${lastRead.ayah_number}`
              : 'No progress yet'}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Display Name</Text>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            style={styles.input}
            placeholder="Your feed name"
            placeholderTextColor={COLORS.muted}
          />
          <Pressable style={styles.btnInline} onPress={() => setProfileName(draftName)}>
            <Text style={styles.btnText}>Save Name</Text>
          </Pressable>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Feed Backend</Text>
          <Text style={styles.blockValue}>
            {isSupabaseConfigured ? 'Supabase connected' : 'Supabase not configured'}
          </Text>
        </View>

        <Pressable style={styles.btn} onPress={clearLastRead}>
          <Text style={styles.btnText}>Reset Last Read</Text>
        </Pressable>

        <Pressable style={[styles.btn, styles.btnWarn]} onPress={clearBookmarks}>
          <Text style={styles.btnText}>Clear All Bookmarks</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  heading: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    padding: 12,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  block: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    padding: 12,
  },
  blockTitle: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  blockValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.text,
    backgroundColor: '#0E1526',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  btn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#101829',
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnWarn: {
    borderColor: '#6B3A3A',
    backgroundColor: '#2A1313',
  },
  btnInline: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: '#101829',
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
