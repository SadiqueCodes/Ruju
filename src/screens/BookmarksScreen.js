import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AyahCard } from '../components/AyahCard';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';

export function BookmarksScreen({ navigation }) {
  const { bookmarkedAyahs, isBookmarked, toggleBookmark, setLastRead, themeMode } = useAppState();
  const colors = getThemeColors(themeMode);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Bookmarks</Text>

        <FlatList
          data={bookmarkedAyahs}
          keyExtractor={(item) => `${item.surah_number}:${item.ayah_number}`}
          style={{ backgroundColor: colors.bg }}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <AyahCard
              ayah={item}
              bookmarked={isBookmarked(item.surah_number, item.ayah_number)}
              onToggleBookmark={() => toggleBookmark(item)}
              onPress={() => {
                setLastRead(item);
                navigation.navigate('Home', {
                  screen: 'Reader',
                  params: {
                    surahNumber: item.surah_number,
                    surahName: item.surah_name,
                    initialAyah: item.ayah_number,
                    jumpAt: Date.now(),
                  },
                });
              }}
            />
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>No bookmarks yet.</Text>}
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
    paddingTop: 6,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  list: {
    flexGrow: 1,
    gap: 10,
    paddingBottom: 40,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});
