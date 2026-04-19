import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ImageBackground, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SurahCard } from '../components/SurahCard';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';
import { filterSurahs } from '../utils/quranData';

export function SurahListScreen({ navigation }) {
  const { surahs, ayahsBySurah, lastRead, themeMode, refreshAyahData } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => filterSurahs(surahs, query), [surahs, query]);

  const todaysAyah = useMemo(() => {
    const shortAyah = (row) => {
      const text = String(row.translation || row.tafseer || '').replace(/\s+/g, ' ').trim();
      return text.length >= 20 && text.length <= 180;
    };
    const rows = Object.values(ayahsBySurah || {})
      .flat()
      .filter((row) => row && row.surah_number && row.ayah_number && (row.translation || row.tafseer))
      .filter(shortAyah);
    if (!rows.length) return null;

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now - start) / 86400000);
    return rows[(day + 19) % rows.length];
  }, [ayahsBySurah]);

  const todaysAyahText = useMemo(() => {
    if (!todaysAyah) return '';
    return String(todaysAyah.translation || todaysAyah.tafseer || '').replace(/\s+/g, ' ').trim();
  }, [todaysAyah]);

  useFocusEffect(
    useCallback(() => {
      refreshAyahData();
    }, [refreshAyahData])
  );

  const openReader = useCallback(
    (surahNumber, surahName, initialAyah) => {
      navigation.navigate('Reader', {
        surahNumber,
        surahName,
        ...(initialAyah ? { initialAyah } : {}),
        jumpAt: Date.now(),
      });
    },
    [navigation]
  );

  const stickySearch = (
    <View style={[styles.stickySearch, { backgroundColor: isLight ? '#FFFFFF' : colors.bg }]}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Surah Library</Text>
        <Text style={[styles.sectionCount, { color: colors.muted }]}>{filtered.length} items</Text>
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search surah name or number"
        placeholderTextColor={colors.muted}
        style={[styles.input, { borderColor: colors.border, backgroundColor: isLight ? '#FFFFFF' : '#101A2A', color: colors.text }]}
      />
    </View>
  );

  const listData = useMemo(() => [{ __sticky: true }, ...filtered], [filtered]);

  const listHeader = (
    <View style={styles.listHeader}>
      {todaysAyah ? (
        <Pressable style={styles.todayCard} onPress={() => openReader(todaysAyah.surah_number, todaysAyah.surah_name, todaysAyah.ayah_number)}>
          <ImageBackground
            source={require('../../svgs/Gemini_Generated_Image_hml49shml49shml4.png')}
            style={styles.todayBg}
            imageStyle={styles.todayBgImage}
            blurRadius={1}
          >
            <View style={styles.todayOverlay} />
            <View style={styles.todaySafeArea}>
              <Text style={styles.todayLabel}>Today's Ayah</Text>
              <View style={styles.todayCenter}>
                <Text style={styles.todayText}>{todaysAyahText}</Text>
              </View>
              <View style={styles.todayBottom}>
                <Text style={styles.todayMeta}>
                  {todaysAyah.surah_name} - Ayah {todaysAyah.ayah_number}
                </Text>
              </View>
            </View>
          </ImageBackground>
        </Pressable>
      ) : null}

      <View style={styles.quickRow}>
        <Pressable
          onPress={() => (lastRead ? openReader(lastRead.surah_number, lastRead.surah_name, lastRead.ayah_number) : null)}
          style={[
            styles.quickCard,
            {
              borderColor: isLight ? '#E7D9BD' : '#35507B',
              backgroundColor: isLight ? '#FFFFFF' : '#101F36',
              opacity: lastRead ? 1 : 0.6,
            },
          ]}
        >
          <View style={styles.quickTop}>
            <View style={[styles.quickIcon, { backgroundColor: isLight ? '#F8F2E2' : '#1D304D' }]}>
              <Ionicons name="book-outline" size={15} color={isLight ? '#9E7A2B' : '#E7C98A'} />
            </View>
            <Text style={[styles.quickKicker, { color: isLight ? '#9E7A2B' : '#E7C98A' }]}>Continue</Text>
          </View>
          <Text style={[styles.quickValue, { color: colors.text }]} numberOfLines={1}>
            {lastRead ? `${lastRead.surah_name} - Ayah ${lastRead.ayah_number}` : 'No recent ayah'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Tasbeeh')}
          style={[styles.quickCard, { borderColor: isLight ? '#C8DBE8' : '#2F5A65', backgroundColor: isLight ? '#FFFFFF' : '#0E2229' }]}
        >
          <View style={styles.quickTop}>
            <View style={[styles.quickIcon, { backgroundColor: isLight ? '#EAF4F8' : '#17333F' }]}>
              <Ionicons name="sparkles-outline" size={15} color={isLight ? '#337488' : '#9ED8E5'} />
            </View>
            <Text style={[styles.quickKicker, { color: isLight ? '#337488' : '#9ED8E5' }]}>Tasbeeh</Text>
          </View>
          <Text style={[styles.quickValue, { color: colors.text }]} numberOfLines={1}>
            Open digital counter
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isLight ? '#FFFFFF' : colors.bg }]} edges={['bottom']}>
      {!isLight ? <View style={[styles.bgBlobA, { backgroundColor: colors.blobA }]} /> : null}
      {!isLight ? <View style={[styles.bgBlobB, { backgroundColor: colors.blobB }]} /> : null}

      <View style={styles.container}>
        <FlatList
          data={listData}
          keyExtractor={(item, index) => (item.__sticky ? '__sticky__' : String(item.surah_number || index))}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.__sticky) return stickySearch;
            return <SurahCard surah={item} themeMode={themeMode} onPress={() => openReader(item.surah_number, item.surah_name)} />;
          }}
          ListFooterComponent={filtered.length ? null : <Text style={[styles.empty, { color: colors.muted }]}>No surah found.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const TODAY_LABEL_FONT = Platform.select({ ios: 'AvenirNext-DemiBold', default: 'serif' });
const TODAY_BODY_FONT = Platform.select({ ios: 'Georgia', default: 'serif' });
const TODAY_META_FONT = Platform.select({ ios: 'AvenirNext-Medium', default: 'serif' });

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  listHeader: {
    paddingTop: 6,
  },
  bgBlobA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.16,
    top: -72,
    right: -52,
  },
  bgBlobB: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.12,
    bottom: -120,
    left: -80,
  },
  todayCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2E476B',
    marginBottom: 12,
    overflow: 'hidden',
  },
  todayBg: {
    minHeight: 170,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  todayBgImage: {
    resizeMode: 'cover',
  },
  todayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  todaySafeArea: {
    width: '92%',
    minHeight: 126,
    alignSelf: 'center',
    justifyContent: 'space-between',
    marginLeft: 0,
  },
  todayLabel: {
    color: '#1E2836',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    marginTop: 4,
    letterSpacing: 0.6,
    fontFamily: TODAY_LABEL_FONT,
    textAlign: 'center',
  },
  todayText: {
    color: '#1A2433',
    fontSize: 12,
    lineHeight: 16.5,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: TODAY_BODY_FONT,
  },
  todayCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginTop: 2,
  },
  todayBottom: {
    alignItems: 'center',
    marginBottom: 5,
  },
  todayMeta: {
    color: '#2A3648',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: TODAY_META_FONT,
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  stickySearch: {
    paddingTop: 4,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 1,
  },
  quickTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 5,
  },
  quickIcon: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickKicker: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  quickValue: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 12,
  },
  list: {
    gap: 11,
    paddingBottom: 28,
  },
  stickyWrap: {
    paddingTop: 2,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});
