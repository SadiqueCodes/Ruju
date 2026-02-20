import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SurahCard } from '../components/SurahCard';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';
import { filterSurahs } from '../utils/quranData';

export function SurahListScreen({ navigation }) {
  const { surahs, lastRead, themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => filterSurahs(surahs, query), [surahs, query]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <View style={[styles.bgBlobA, { backgroundColor: colors.blobA }]} />
      <View style={[styles.bgBlobB, { backgroundColor: colors.blobB }]} />

      <View style={styles.container}>
        <Text style={[styles.kicker, { color: colors.gold }]}>Ruju Quran</Text>
        <Text style={[styles.heading, { color: colors.text }]}>All Surahs</Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search surah name or number"
          placeholderTextColor={colors.muted}
          style={[styles.input, { borderColor: colors.border, backgroundColor: isLight ? '#F1F5FC' : '#0E1526', color: colors.text }]}
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
            style={[styles.resumeCard, { borderColor: isLight ? '#B7CAE8' : '#355179', backgroundColor: isLight ? '#EAF2FF' : '#0E1C36' }]}
          >
            <Text style={[styles.resumeLabel, { color: colors.accent }]}>Continue Reading</Text>
            <Text style={[styles.resumeValue, { color: colors.text }]}> 
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
              themeMode={themeMode}
              onPress={() =>
                navigation.navigate('Reader', {
                  surahNumber: item.surah_number,
                  surahName: item.surah_name,
                })
              }
            />
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>No surah found.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
    opacity: 0.18,
    top: -70,
    right: -50,
  },
  bgBlobB: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.14,
    bottom: -120,
    left: -80,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  resumeCard: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  resumeLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  resumeValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    gap: 10,
    paddingBottom: 30,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});
