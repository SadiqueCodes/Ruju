import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';

function makeStyles(colors, isLight) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 32, gap: 8 },
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
      overflow: 'hidden',
    },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, paddingRight: 8, flexShrink: 1 },
    actionTextWrap: { flex: 1, minWidth: 0, flexShrink: 1 },
    actionText: { color: colors.text, fontWeight: '700' },
    actionHint: { color: colors.muted, fontSize: 12 },
    rightIcon: { marginLeft: 8, flexShrink: 0 },
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: isLight ? 'rgba(10,16,28,0.24)' : 'rgba(0,0,0,0.56)',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    modalCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.card,
      padding: 14,
      gap: 10,
    },
    modalTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    modalText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 2 },
    modalCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#F2F4F8' : '#131C2E',
    },
    modalCancelText: { color: colors.text, fontWeight: '700', fontSize: 13 },
    modalDangerBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#784444',
      backgroundColor: isLight ? '#FFECEC' : '#2A1313',
    },
    modalDangerText: { color: '#D96363', fontWeight: '800', fontSize: 13 },
  });
}

export function SettingsScreen({ navigation }) {
  const { clearBookmarks, clearLastRead, clearProfileSetup, themeMode, toggleThemeMode } = useAppState();
  const [showClearBookmarksModal, setShowClearBookmarksModal] = useState(false);
  const [showResetProfileModal, setShowResetProfileModal] = useState(false);
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const styles = useMemo(() => makeStyles(colors, isLight), [colors, isLight]);

  async function shareApp() {
    try {
      await Share.share({
        message: 'Try Ruju Quran app. Quran reading, tafseer and community feed in one place.',
      });
    } catch (_err) {
      Alert.alert('Share failed', 'Could not open share sheet.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>Settings</Text>
            <View style={styles.modePill}>
              <Ionicons name={isLight ? 'sunny-outline' : 'moon-outline'} size={14} color={colors.text} />
              <Text style={styles.modePillText}>{isLight ? 'Light' : 'Dark'}</Text>
            </View>
          </View>
          <Text style={styles.heroSub}>Manage appearance, profile reset and reading preferences.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="color-palette-outline" size={16} color={colors.accent} />
            <Text style={styles.cardTitle}>Appearance</Text>
          </View>
          <Pressable style={styles.actionBtn} onPress={toggleThemeMode}>
            <View style={styles.actionLeft}>
              <Ionicons name={isLight ? 'moon-outline' : 'sunny-outline'} size={18} color={colors.text} />
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionText}>{isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</Text>
                <Text style={styles.actionHint}>Instant app-wide theme change</Text>
              </View>
            </View>
            <Ionicons style={styles.rightIcon} name="chevron-forward" size={16} color={colors.muted} />
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
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionText}>My Profile</Text>
                <Text style={styles.actionHint}>Manage posts and remove old entries</Text>
              </View>
            </View>
            <Ionicons style={styles.rightIcon} name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={clearLastRead}>
            <View style={styles.actionLeft}>
              <Ionicons name="reload-outline" size={18} color={colors.text} />
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionText}>Reset Last Read</Text>
                <Text style={styles.actionHint}>Clears the resume-reading position</Text>
              </View>
            </View>
            <Ionicons style={styles.rightIcon} name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>

          <Pressable
            style={styles.warnBtn}
            onPress={() => setShowClearBookmarksModal(true)}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="trash-outline" size={18} color="#D96363" />
              <View style={styles.actionTextWrap}>
                <Text style={styles.warnText}>Clear All Bookmarks</Text>
                <Text style={styles.actionHint}>This action cannot be undone</Text>
              </View>
            </View>
            <Ionicons style={styles.rightIcon} name="warning-outline" size={16} color="#D96363" />
          </Pressable>

          <Pressable
            style={styles.warnBtn}
            onPress={() => setShowResetProfileModal(true)}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="person-remove-outline" size={18} color="#D96363" />
              <View style={styles.actionTextWrap}>
                <Text style={styles.warnText}>Reset Name & Gender</Text>
                <Text style={styles.actionHint}>On next screen you will set profile again</Text>
              </View>
            </View>
            <Ionicons style={styles.rightIcon} name="warning-outline" size={16} color="#D96363" />
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
            <Text style={styles.cardTitle}>About</Text>
          </View>
          <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('About')}>
            <View style={styles.actionLeft}>
              <Ionicons name="book-outline" size={18} color={colors.text} />
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionText}>Ruju Quran</Text>
                <Text style={styles.actionHint}>Tap to read app info</Text>
              </View>
            </View>
            <Ionicons style={styles.rightIcon} name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={shareApp}>
            <View style={styles.actionLeft}>
              <Ionicons name="share-social-outline" size={18} color={colors.text} />
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionText}>Share App</Text>
                <Text style={styles.actionHint}>Send app text to friends</Text>
              </View>
            </View>
            <Ionicons style={styles.rightIcon} name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showClearBookmarksModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearBookmarksModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowClearBookmarksModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Clear All Bookmarks</Text>
            <Text style={styles.modalText}>Are you sure you want to remove all saved ayahs? This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowClearBookmarksModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalDangerBtn}
                onPress={() => {
                  setShowClearBookmarksModal(false);
                  clearBookmarks();
                }}
              >
                <Text style={styles.modalDangerText}>Clear</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showResetProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetProfileModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowResetProfileModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Reset Name & Gender</Text>
            <Text style={styles.modalText}>This will show onboarding again for name and gender.</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowResetProfileModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalDangerBtn}
                onPress={() => {
                  setShowResetProfileModal(false);
                  clearProfileSetup();
                }}
              >
                <Text style={styles.modalDangerText}>Reset</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
