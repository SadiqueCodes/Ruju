import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AyahCard } from '../components/AyahCard';
import { COLORS } from '../theme';
import { useAppState } from '../state/AppState';
import { filterAyahs } from '../utils/quranData';

export function ReaderScreen({ route }) {
  const { surahNumber, initialAyah } = route.params || {};
  const { ayahsBySurah, isBookmarked, toggleBookmark, setLastRead } = useAppState();
  const [query, setQuery] = useState('');
  const markedInitial = useRef(false);

  const ayahs = ayahsBySurah[surahNumber] || [];
  const visibleAyahs = useMemo(() => filterAyahs(ayahs, query), [ayahs, query]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length === 0) return;
    const first = viewableItems[0]?.item;
    if (first) setLastRead(first);
  }).current;

  useEffect(() => {
    if (markedInitial.current || !initialAyah || ayahs.length === 0) return;
    const current = ayahs.find((a) => a.ayah_number === initialAyah);
    if (current) {
      setLastRead(current);
      markedInitial.current = true;
    }
  }, [ayahs, initialAyah, setLastRead]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search inside this surah"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
        />

        <FlatList
          data={visibleAyahs}
          keyExtractor={(item) => `${item.surah_number}:${item.ayah_number}`}
          contentContainerStyle={styles.list}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <AyahCard
              ayah={item}
              bookmarked={isBookmarked(item.surah_number, item.ayah_number)}
              onToggleBookmark={() => toggleBookmark(item)}
              onPress={() => setLastRead(item)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No ayah found in this filter.</Text>}
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
    paddingTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#0E1526',
    color: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 40,
  },
  empty: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 20,
  },
});
