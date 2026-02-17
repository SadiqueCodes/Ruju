import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';

export function NameSetupScreen({ onSubmit }) {
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.kicker}>Welcome</Text>
        <Text style={styles.title}>Your Display Name</Text>
        <Text style={styles.desc}>This name appears on feed posts and comments.</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          maxLength={24}
        />

        <Pressable
          style={[styles.btn, !name.trim() && styles.btnDisabled]}
          disabled={!name.trim()}
          onPress={() => onSubmit(name.trim())}
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
