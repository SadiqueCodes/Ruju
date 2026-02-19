import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAppState } from '../state/AppState';

export function SettingsScreen({ navigation }) {
  const { clearBookmarks, clearLastRead, profileName, setProfileName } = useAppState();
  const [draftName, setDraftName] = useState(profileName || '');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
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

        <Pressable style={styles.btn} onPress={() => navigation.navigate('MyProfile')}>
          <Text style={styles.btnText}>My Profile</Text>
        </Pressable>

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
    paddingTop: 2,
    gap: 12,
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