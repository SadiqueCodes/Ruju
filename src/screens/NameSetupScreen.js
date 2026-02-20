import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import MaleMuslimSvg from '../../svgs/male-muslim.svg';
import FemaleMuslimSvg from '../../svgs/female-muslim.svg';

export function NameSetupScreen({ onSubmit }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const canContinue = !!name.trim() && (gender === 'male' || gender === 'female');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.kicker}>Welcome</Text>
        <Text style={styles.title}>Your Display Name</Text>
        <Text style={styles.desc}>This name appears on feed posts and comments. Choose your gender with the icons below.</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={COLORS.muted}
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '900',
  },
  desc: {
    color: COLORS.muted,
    marginTop: 10,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#0E1526',
    color: COLORS.text,
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
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#0E1526',
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
    backgroundColor: '#172238',
    marginBottom: 2,
  },
  genderBtnActive: {
    borderColor: COLORS.gold,
    backgroundColor: '#221A0C',
  },
  genderText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },
  genderTextActive: {
    color: COLORS.gold,
  },
  btn: {
    marginTop: 14,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    color: '#1E1608',
    fontWeight: '800',
  },
});
