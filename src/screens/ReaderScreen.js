import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AyahCard } from '../components/AyahCard';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';
import { filterAyahs } from '../utils/quranData';

export function ReaderScreen({ route }) {
  const { surahNumber, initialAyah, jumpAt } = route.params || {};
  const { ayahsBySurah, isBookmarked, toggleBookmark, setLastRead, themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const [query, setQuery] = useState('');
  const listRef = useRef(null);
  const lastHandledJumpKeyRef = useRef('');
  const pendingJumpIndexRef = useRef(-1);
  const pendingJumpAyahRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);

  const ayahs = ayahsBySurah[surahNumber] || [];
  const visibleAyahs = useMemo(() => filterAyahs(ayahs, query), [ayahs, query]);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const retryJump = (index, animated = true) => {
    if (index < 0) return;
    listRef.current?.scrollToIndex?.({ index, animated, viewPosition: 0 });
  };

  const scheduleRetry = (index) => {
    if (index < 0) return;
    if (retryCountRef.current >= 8) return;
    clearRetryTimer();
    retryCountRef.current += 1;
    const waitMs = 180 + retryCountRef.current * 120;
    retryTimerRef.current = setTimeout(() => {
      retryJump(index, retryCountRef.current > 1);
    }, waitMs);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length === 0) return;
    const first = viewableItems[0]?.item;
    if (first) setLastRead(first);

    const targetAyah = pendingJumpAyahRef.current;
    if (!targetAyah) return;

    const hit = viewableItems.some((v) => v?.item?.ayah_number === targetAyah);
    if (hit) {
      pendingJumpAyahRef.current = null;
      retryCountRef.current = 0;
      clearRetryTimer();
    }
  }).current;

  useEffect(() => {
    if (!initialAyah || ayahs.length === 0) return;
    const jumpKey = `${surahNumber}:${initialAyah}:${jumpAt || ''}`;
    if (lastHandledJumpKeyRef.current === jumpKey) return;

    // Ensure list is unfiltered before trying to jump to absolute index.
    if (query.trim()) {
      setQuery('');
      return;
    }

    const current = ayahs.find((a) => a.ayah_number === initialAyah);
    if (!current) return;

    setLastRead(current);
    lastHandledJumpKeyRef.current = jumpKey;

    const targetIndex = ayahs.findIndex((a) => a.ayah_number === initialAyah);
    if (targetIndex < 0) return;
    pendingJumpIndexRef.current = targetIndex;
    pendingJumpAyahRef.current = initialAyah;
    retryCountRef.current = 0;
    clearRetryTimer();

    requestAnimationFrame(() => {
      retryJump(targetIndex, true);
      scheduleRetry(targetIndex);
    });
  }, [ayahs, initialAyah, jumpAt, query, setLastRead, surahNumber]);

  useEffect(() => {
    return () => clearRetryTimer();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <View style={styles.container}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search inside this surah"
          placeholderTextColor={colors.muted}
          style={[styles.input, { borderColor: colors.border, backgroundColor: isLight ? '#F2F6FF' : '#0E1526', color: colors.text }]}
        />

        <FlatList
          ref={listRef}
          data={visibleAyahs}
          keyExtractor={(item) => `${item.surah_number}:${item.ayah_number}`}
          contentContainerStyle={styles.list}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onScrollToIndexFailed={({ index, highestMeasuredFrameIndex }) => {
            const safeIndex = Math.max(0, highestMeasuredFrameIndex || 0);
            if (safeIndex > 0) {
              listRef.current?.scrollToIndex?.({ index: safeIndex, animated: false });
            }
            const retryIndex = pendingJumpIndexRef.current >= 0 ? pendingJumpIndexRef.current : index;
            scheduleRetry(retryIndex);
          }}
          renderItem={({ item }) => (
            <AyahCard
              ayah={item}
              bookmarked={isBookmarked(item.surah_number, item.ayah_number)}
              onToggleBookmark={() => toggleBookmark(item)}
              onPress={() => setLastRead(item)}
            />
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>No ayah found in this filter.</Text>}
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
    paddingTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 40,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});
