import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';
import MaleMuslimSvg from '../../svgs/male-muslim.svg';
import FemaleMuslimSvg from '../../svgs/female-muslim.svg';

function makeStyles(colors, isLight) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
    },
    logoWrap: {
      width: 240,
      height: 54,
      alignSelf: 'flex-start',
      justifyContent: 'center',
      alignItems: 'flex-start',
      overflow: 'hidden',
      marginLeft: -4,
      marginTop: 4,
      marginBottom: 6,
    },
    logoImage: {
      width: 400,
      height: 134,
      marginLeft: -138,
    },
    kicker: {
      color: colors.gold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontWeight: '700',
    },
    title: {
      marginTop: 4,
      color: colors.text,
      fontSize: 32,
      fontWeight: '900',
    },
    desc: {
      color: colors.muted,
      marginTop: 10,
      marginBottom: 18,
      fontSize: 14,
      lineHeight: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    genderRow: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 10,
    },
    genderBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      gap: 4,
    },
    svgWrap: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isLight ? '#EEF3FF' : '#172238',
      marginBottom: 2,
    },
    genderBtnActive: {
      borderColor: colors.gold,
      backgroundColor: isLight ? '#FFF3DA' : '#221A0C',
    },
    genderText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 13,
    },
    genderTextActive: {
      color: colors.gold,
    },
    btn: {
      marginTop: 14,
      backgroundColor: colors.gold,
      borderRadius: 12,
      alignItems: 'center',
      paddingVertical: 12,
    },
    btnDisabled: {
      opacity: 0.45,
    },
    btnText: {
      color: isLight ? '#2A1E0C' : '#1E1608',
      fontWeight: '800',
    },
  });
}

export function NameSetupScreen({ onSubmit }) {
  const { themeMode } = useAppState();
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const styles = useMemo(() => makeStyles(colors, isLight), [colors, isLight]);
  const canContinue = !!name.trim() && (gender === 'male' || gender === 'female');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../svgs/Untitled_design__3_-removebg-preview.png')}
            style={[
              styles.logoImage,
              {
                tintColor: isLight ? undefined : '#FFF7E8',
                opacity: isLight ? 1 : 0.96,
              },
            ]}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.kicker}>Welcome</Text>
        <Text style={styles.title}>Your Display Name</Text>
        <Text style={styles.desc}>This name appears on feed posts and comments. Choose your gender with the icons below.</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={colors.muted}
          style={styles.input}
          maxLength={24}
        />

        <View style={styles.genderRow}>
          <Pressable
            style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
            onPress={() => setGender('male')}
          >
            <View style={styles.svgWrap}>
              <MaleMuslimSvg width={46} height={46} />
            </View>
            <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
          </Pressable>

          <Pressable
            style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
            onPress={() => setGender('female')}
          >
            <View style={styles.svgWrap}>
              <FemaleMuslimSvg width={46} height={46} />
            </View>
            <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          disabled={!canContinue}
          onPress={() => onSubmit(name.trim(), gender)}
        >
          <Text style={styles.btnText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
