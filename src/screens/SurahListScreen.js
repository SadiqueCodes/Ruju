import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SurahCard } from '../components/SurahCard';
import { COLORS } from '../theme';
import { useAppState } from '../state/AppState';
import { filterSurahs } from '../utils/quranData';

export function SurahListScreen({ navigation }) {
  const { surahs, lastRead } = useAppState();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => filterSurahs(surahs, query), [surahs, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.bgBlobA} />
      <View style={styles.bgBlobB} />

      <View style={styles.container}>
        <Text style={styles.kicker}>Ruju Quran</Text>
        <Text style={styles.heading}>All Surahs</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search surah name or number"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        {lastRead ? (
          <Pressable
            onPress={() =>
              navigation.navigate('Reader', {
                surahNumber: lastRead.surah_number,
                surahName: lastRead.surah_name,
                initialAyah: lastRead.ayah_number,
                jumpAt: Date.now(),
              })
            }
            style={styles.resumeCard}
          >
            <Text style={styles.resumeLabel}>Continue Reading</Text>
            <Text style={styles.resumeValue}>
              {lastRead.surah_name} - Ayah {lastRead.ayah_number}
            </Text>
          </Pressable>
        ) : null}

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.surah_number)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SurahCard
              surah={item}
              onPress={() =>
                navigation.navigate('Reader', {
                  surahNumber: item.surah_number,
                  surahName: item.surah_name,
                })
              }
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No surah found.</Text>}
        />
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
  },
  bgBlobA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.blobA,
    opacity: 0.18,
    top: -70,
    right: -50,
  },
  bgBlobB: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.blobB,
    opacity: 0.14,
    bottom: -120,
    left: -80,
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  heading: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#0E1526',
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  resumeCard: {
    borderWidth: 1,
    borderColor: '#355179',
    backgroundColor: '#0E1C36',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  resumeLabel: {
    color: COLORS.accent,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  resumeValue: {
    color: COLORS.text,
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    gap: 10,
    paddingBottom: 30,
  },
  empty: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 20,
  },
});
