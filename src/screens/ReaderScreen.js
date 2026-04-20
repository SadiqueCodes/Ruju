import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const [searchMode, setSearchMode] = useState('ayah_number');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const listRef = useRef(null);
  const lastHandledJumpKeyRef = useRef('');
  const jumpTargetIndexRef = useRef(-1);
  const jumpTargetAyahRef = useRef(null);
  const retryTimerRef = useRef(null);
  const jumpRetryCountRef = useRef(0);
  const ESTIMATED_AYAH_CARD_HEIGHT = 260;

  const ayahs = ayahsBySurah[surahNumber] || [];
  const ayahJumpNumber = useMemo(() => {
    if (searchMode !== 'ayah_number') return null;
    const q = query.trim();
    if (!q) return null;
    const n = Number(q);
    return Number.isNaN(n) ? null : n;
  }, [query, searchMode]);

  const visibleAyahs = useMemo(() => {
    const q = query.trim();
    if (!q) return ayahs;
    if (searchMode === 'ayah_number') {
      // Keep full list visible for number search; we jump to matching ayah via effect.
      return ayahs;
    }
    return filterAyahs(ayahs, q);
  }, [ayahs, query, searchMode]);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const retryJump = (index, animated = false) => {
    if (index < 0) return;
    listRef.current?.scrollToIndex?.({ index, animated, viewPosition: 0 });
  };

  const scheduleRetry = (index) => {
    if (index < 0) return;
    if (jumpRetryCountRef.current >= 6) return;
    clearRetryTimer();
    jumpRetryCountRef.current += 1;
    const waitMs = 130 + jumpRetryCountRef.current * 120;
    retryTimerRef.current = setTimeout(() => {
      retryJump(index, false);
      scheduleRetry(index);
    }, waitMs);
  };

  const jumpToAyah = (ayahNumber) => {
    if (!ayahNumber) return;
    const targetIndex = ayahs.findIndex((a) => Number(a.ayah_number) === Number(ayahNumber));
    if (targetIndex < 0) return;

    jumpTargetIndexRef.current = targetIndex;
    jumpTargetAyahRef.current = Number(ayahNumber);
    jumpRetryCountRef.current = 0;
    clearRetryTimer();

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset?.({
        offset: Math.max(0, targetIndex * ESTIMATED_AYAH_CARD_HEIGHT),
        animated: false,
      });
      retryJump(targetIndex, false);
      scheduleRetry(targetIndex);
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length === 0) return;
    const first = viewableItems[0]?.item;
    if (first) setLastRead(first);

    const targetAyah = jumpTargetAyahRef.current;
    if (!targetAyah) return;

    const hit = viewableItems.some((v) => v?.item?.ayah_number === targetAyah);
    if (hit) {
      jumpTargetAyahRef.current = null;
      jumpTargetIndexRef.current = -1;
      jumpRetryCountRef.current = 0;
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
    jumpToAyah(initialAyah);
  }, [ayahs, initialAyah, jumpAt, query, setLastRead, surahNumber]);

  useEffect(() => {
    return () => clearRetryTimer();
  }, []);

  useEffect(() => {
    if (searchMode !== 'ayah_number') return;
    if (!ayahJumpNumber) return;
    jumpToAyah(ayahJumpNumber);
  }, [ayahJumpNumber, ayahs, searchMode]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <View style={styles.container}>
        <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: isLight ? '#F2F6FF' : '#0E1526' }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchMode === 'ayah_number' ? 'Search ayah number' : 'Search content'}
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.text }]}
          />
          <Pressable
            style={styles.filterBtn}
            onPress={() => setShowModeMenu((p) => !p)}
          >
            <Ionicons name="options-outline" size={17} color={colors.text} />
          </Pressable>

          {showModeMenu ? (
            <View style={[styles.modeMenu, { borderColor: colors.border, backgroundColor: isLight ? '#FFFFFF' : '#10192B' }]}>
              <Pressable
                style={[styles.modeMenuItem, searchMode === 'ayah_number' && { backgroundColor: isLight ? '#FFF3DA' : '#241D12' }]}
                onPress={() => {
                  setSearchMode('ayah_number');
                  setShowModeMenu(false);
                }}
              >
                <Text style={[styles.modeMenuText, { color: searchMode === 'ayah_number' ? colors.gold : colors.text }]}>Ayah Number</Text>
              </Pressable>
              <Pressable
                style={[styles.modeMenuItem, searchMode === 'content' && { backgroundColor: isLight ? '#FFF3DA' : '#241D12' }]}
                onPress={() => {
                  setSearchMode('content');
                  setShowModeMenu(false);
                }}
              >
                <Text style={[styles.modeMenuText, { color: searchMode === 'content' ? colors.gold : colors.text }]}>Content</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <FlatList
          ref={listRef}
          data={visibleAyahs}
          keyExtractor={(item) => `${item.surah_number}:${item.ayah_number}`}
          contentContainerStyle={styles.list}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onScrollToIndexFailed={({ index, highestMeasuredFrameIndex, averageItemLength }) => {
            const retryIndex = jumpTargetIndexRef.current >= 0 ? jumpTargetIndexRef.current : index;
            const safeIndex = Math.max(0, highestMeasuredFrameIndex || 0);
            if (safeIndex > 0 && safeIndex < retryIndex) {
              listRef.current?.scrollToIndex?.({ index: safeIndex, animated: false });
            }
            const approxOffset = Math.max(0, (averageItemLength || 0) * retryIndex);
            if (approxOffset > 0) {
              listRef.current?.scrollToOffset?.({ offset: approxOffset, animated: false });
            }
            setTimeout(() => retryJump(retryIndex, false), 120);
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
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchWrap: {
    position: 'relative',
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingRight: 4,
  },
  filterBtn: {
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeMenu: {
    position: 'absolute',
    right: 0,
    top: 44,
    width: 148,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 20,
  },
  modeMenuItem: {
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  modeMenuText: {
    fontSize: 12,
    fontWeight: '700',
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
