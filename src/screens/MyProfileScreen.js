import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { useAppState } from '../state/AppState';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

function parseStyledContent(raw) {
  const text = raw || '';
  const match = text.match(/^\[\[style:([a-z0-9_-]+)\]\]\n?/i);
  if (!match) return text;
  return text.replace(match[0], '');
}

export function MyProfileScreen() {
  const { profileName, deviceId } = useAppState();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const tileSize = useMemo(() => {
    const width = Dimensions.get('window').width;
    const horizontalPadding = 24; // container padding (12 + 12)
    const gap = 8 * 2; // 3 columns => 2 gaps
    return Math.floor((width - horizontalPadding - gap) / 3);
  }, []);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);

    let data = null;
    const withDevice = await supabase
      .from('feed_posts')
      .select('id, author_name, author_device_id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(300);

    if (withDevice.error) {
      const fallback = await supabase
        .from('feed_posts')
        .select('id, author_name, content, created_at')
        .order('created_at', { ascending: false })
        .limit(300);
      data = fallback.data || [];
    } else {
      data = withDevice.data || [];
    }

    const mine = data.filter((p) => (p.author_device_id ? p.author_device_id === deviceId : p.author_name === profileName));
    setPosts(mine);
    setLoading(false);
  }, [deviceId, profileName]);

  useEffect(() => {
    load();
  }, [load]);

  async function deletePost(post) {
    if (!supabase) return;
    const del = await supabase.from('feed_posts').delete().eq('id', post.id);
    if (del.error) {
      Alert.alert('Delete failed', del.error.message || 'Could not delete this post.');
      return;
    }
    load();
  }

  function confirmDelete(post) {
    Alert.alert('Delete Post', 'Delete this post permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePost(post) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          onRefresh={load}
          refreshing={loading}
          renderItem={({ item }) => (
            <View style={[styles.tile, { width: tileSize, height: tileSize }]}> 
              <Pressable style={styles.deleteBadge} onPress={() => confirmDelete(item)}>
                <Ionicons name="close-circle" size={22} color="#E65959" />
              </Pressable>
              <Text style={styles.tileText} numberOfLines={6}>{parseStyledContent(item.content)}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 2 },
  grid: { paddingBottom: 30 },
  row: { justifyContent: 'space-between', marginBottom: 8 },
  tile: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#ECECEC',
    padding: 8,
    overflow: 'hidden',
  },
  deleteBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 5,
  },
  tileText: { color: '#111', fontSize: 12, lineHeight: 16, marginTop: 14 },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 18 },
});