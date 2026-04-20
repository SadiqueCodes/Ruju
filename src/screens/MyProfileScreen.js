import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';
import MaleMuslimSvg from '../../svgs/male-muslim.svg';
import FemaleMuslimSvg from '../../svgs/female-muslim.svg';

function makeStyles(colors, isLight) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1, paddingHorizontal: 14, paddingTop: 1 },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.card,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#EDF3FF' : '#0E1526',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarSvgWrap: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { color: colors.text, fontSize: 20, fontWeight: '800' },
    sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  });
}

export function MyProfileScreen() {
  const { profileName, profileGender, themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const styles = useMemo(() => makeStyles(colors, isLight), [colors, isLight]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <View style={styles.avatarSvgWrap}>
              {profileGender === 'female' ? <FemaleMuslimSvg width={30} height={30} /> : <MaleMuslimSvg width={30} height={30} />}
            </View>
          </View>
          <View>
            <Text style={styles.name}>{profileName || 'My Profile'}</Text>
            <Text style={styles.sub}>Profile details</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
