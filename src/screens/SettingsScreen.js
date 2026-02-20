import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';

function makeStyles(colors, isLight) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 14 },

    hero: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 14,
      backgroundColor: colors.card,
      gap: 10,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
    heroSub: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    modePill: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: isLight ? '#F1F5FF' : '#0E1526',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    modePillText: { color: colors.text, fontSize: 11, fontWeight: '700' },

    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 12,
      backgroundColor: colors.card,
      gap: 10,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
    cardSub: { color: colors.muted, fontSize: 12, lineHeight: 18 },

    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      color: colors.text,
      backgroundColor: isLight ? '#F2F5FC' : '#0E1526',
      paddingHorizontal: 11,
      paddingVertical: 10,
      fontSize: 14,
    },

    rowButtons: { flexDirection: 'row', gap: 10 },
    primaryBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
      backgroundColor: colors.gold,
    },
    primaryBtnText: { color: '#1E1608', fontWeight: '800', fontSize: 13 },
    secondaryBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#EEF3FF' : '#101829',
    },
    secondaryBtnText: { color: colors.text, fontWeight: '700', fontSize: 13 },

    actionBtn: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#EEF3FF' : '#101829',
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    actionText: { color: colors.text, fontWeight: '700' },
    actionHint: { color: colors.muted, fontSize: 12 },

    warnBtn: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#784444',
      backgroundColor: isLight ? '#FFECEC' : '#2A1313',
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    warnText: { color: '#D96363', fontWeight: '800' },
  });
}

export function SettingsScreen({ navigation }) {
  const { clearBookmarks, clearLastRead, profileName, setProfileName, themeMode, toggleThemeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const styles = useMemo(() => makeStyles(colors, isLight), [colors, isLight]);
  const [draftName, setDraftName] = useState(profileName || '');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>Settings</Text>
            <View style={styles.modePill}>
              <Ionicons name={isLight ? 'sunny-outline' : 'moon-outline'} size={14} color={colors.text} />
              <Text style={styles.modePillText}>{isLight ? 'Light' : 'Dark'}</Text>
            </View>
          </View>
          <Text style={styles.heroSub}>Manage your profile, appearance and reading preferences.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={16} color={colors.accent} />
            <Text style={styles.cardTitle}>Profile Name</Text>
          </View>
          <Text style={styles.cardSub}>This name appears on your posts and comments.</Text>
          <TextInput
            value={draftName}
            onChangeText={setDraftName}
            style={styles.input}
            placeholder="Your feed name"
            placeholderTextColor={colors.muted}
          />
          <View style={styles.rowButtons}>
            <Pressable style={styles.primaryBtn} onPress={() => setProfileName(draftName)}>
              <Text style={styles.primaryBtnText}>Save Name</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => setDraftName(profileName || '')}>
              <Text style={styles.secondaryBtnText}>Reset</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="color-palette-outline" size={16} color={colors.accent} />
            <Text style={styles.cardTitle}>Appearance</Text>
          </View>
          <Pressable style={styles.actionBtn} onPress={toggleThemeMode}>
            <View style={styles.actionLeft}>
              <Ionicons name={isLight ? 'moon-outline' : 'sunny-outline'} size={18} color={colors.text} />
              <View>
                <Text style={styles.actionText}>{isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</Text>
                <Text style={styles.actionHint}>Instant app-wide theme change</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="library-outline" size={16} color={colors.accent} />
            <Text style={styles.cardTitle}>Reading Data</Text>
          </View>

          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('MyProfile')}>
            <View style={styles.actionLeft}>
              <Ionicons name="grid-outline" size={18} color={colors.text} />
              <View>
                <Text style={styles.actionText}>My Profile</Text>
                <Text style={styles.actionHint}>Manage posts and remove old entries</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={clearLastRead}>
            <View style={styles.actionLeft}>
              <Ionicons name="reload-outline" size={18} color={colors.text} />
              <View>
                <Text style={styles.actionText}>Reset Last Read</Text>
                <Text style={styles.actionHint}>Clears the resume-reading position</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>

          <Pressable style={styles.warnBtn} onPress={clearBookmarks}>
            <View style={styles.actionLeft}>
              <Ionicons name="trash-outline" size={18} color="#D96363" />
              <View>
                <Text style={styles.warnText}>Clear All Bookmarks</Text>
                <Text style={styles.actionHint}>This action cannot be undone</Text>
              </View>
            </View>
            <Ionicons name="warning-outline" size={16} color="#D96363" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
