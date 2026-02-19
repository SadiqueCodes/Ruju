import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AyahCard } from '../components/AyahCard';
import { COLORS } from '../theme';
import { useAppState } from '../state/AppState';

export function BookmarksScreen({ navigation }) {
  const { bookmarkedAyahs, isBookmarked, toggleBookmark, setLastRead } = useAppState();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.heading}>Bookmarks</Text>

        <FlatList
          data={bookmarkedAyahs}
          keyExtractor={(item) => `${item.surah_number}:${item.ayah_number}`}
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
                  },
                });
              }}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No bookmarks yet.</Text>}
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
    paddingTop: 6,
  },
  heading: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
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
