import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../theme';
import { useAppState } from '../state/AppState';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import MaleMuslimSvg from '../../svgs/male-muslim.svg';
import FemaleMuslimSvg from '../../svgs/female-muslim.svg';

function parseStyledContent(raw) {
  const text = raw || '';
  const match = text.match(/^\[\[(post|style):([^\]]+)\]\]\n?/i);
  if (!match) return text;
  return text.replace(match[0], '');
}

function makeStyles(colors, isLight) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1, paddingHorizontal: 12, paddingTop: 4 },

    hero: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.card,
      padding: 12,
      marginBottom: 10,
      gap: 8,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    profileHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#EDF3FF' : '#0E1526',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarSvgWrap: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { color: colors.text, fontSize: 18, fontWeight: '800' },
    sub: { color: colors.muted, fontSize: 12 },
    refreshBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: isLight ? '#EDF3FF' : '#0E1526',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    refreshText: { color: colors.text, fontSize: 11, fontWeight: '700' },
    statsRow: { flexDirection: 'row', gap: 8 },
    statCard: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: isLight ? '#F8FAFF' : '#0E1526',
      paddingVertical: 10,
      alignItems: 'center',
    },
    statNumber: { color: colors.text, fontSize: 18, fontWeight: '800' },
    statLabel: { color: colors.muted, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.7 },

    grid: { paddingBottom: 28 },
    row: { justifyContent: 'space-between', marginBottom: 8 },
    tile: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#FFFFFF' : '#ECECEC',
      padding: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    tileText: { color: '#111', fontSize: 12, lineHeight: 16, marginTop: 16 },
    deleteBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      zIndex: 5,
      borderRadius: 999,
      padding: 1,
      backgroundColor: isLight ? '#FFF1F1' : '#2B1515',
    },
    emptyWrap: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      padding: 18,
      marginTop: 8,
      alignItems: 'center',
      gap: 8,
    },
    empty: { color: colors.muted, textAlign: 'center' },
    modalBackdrop: {
      flex: 1,
      backgroundColor: isLight ? 'rgba(10,16,28,0.24)' : 'rgba(0,0,0,0.56)',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    modalCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.card,
      padding: 14,
      gap: 10,
    },
    modalTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    modalText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 2 },
    modalCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#F2F4F8' : '#131C2E',
    },
    modalCancelText: { color: colors.text, fontWeight: '700', fontSize: 13 },
    modalDangerBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#784444',
      backgroundColor: isLight ? '#FFECEC' : '#2A1313',
    },
    modalDangerText: { color: '#D96363', fontWeight: '800', fontSize: 13 },
  });
}

export function MyProfileScreen() {
  const { profileName, profileGender, deviceId, themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const styles = useMemo(() => makeStyles(colors, isLight), [colors, isLight]);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTargetPost, setDeleteTargetPost] = useState(null);

  const tileSize = useMemo(() => {
    const width = Dimensions.get('window').width;
    const horizontalPadding = 24;
    const gap = 8 * 2;
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
      const msg = del.error.message || 'Could not delete this post.';
      if (/policy|permission|42501/i.test(msg)) {
        Alert.alert('Delete blocked by policy', 'Run feed delete policy SQL, then try again.');
      } else {
        Alert.alert('Delete failed', msg);
      }
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    load();
  }

  function confirmDelete(post) {
    setDeleteTargetPost(post);
    setDeleteConfirmVisible(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <View style={styles.profileHead}>
              <View style={styles.avatar}>
                <View style={styles.avatarSvgWrap}>
                  {profileGender === 'female' ? (
                    <FemaleMuslimSvg width={26} height={26} />
                  ) : (
                    <MaleMuslimSvg width={26} height={26} />
                  )}
                </View>
              </View>
              <View>
                <Text style={styles.name}>{profileName || 'My Profile'}</Text>
                <Text style={styles.sub}>Manage your created posts</Text>
              </View>
            </View>
            <Pressable style={styles.refreshBtn} onPress={load}>
              <Ionicons name="refresh-outline" size={14} color={colors.text} />
              <Text style={styles.refreshText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
            </Pressable>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{posts.length ? posts[0]?.created_at?.slice(0, 10) || '-' : '-'}</Text>
              <Text style={styles.statLabel}>Latest</Text>
            </View>
          </View>
        </View>

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
              <Pressable
                style={({ pressed }) => [styles.deleteBadge, pressed && { transform: [{ scale: 0.92 }], opacity: 0.85 }]}
                onPress={() => confirmDelete(item)}
              >
                <Ionicons name="close-circle" size={22} color="#E65959" />
              </Pressable>
              <Text style={styles.tileText} numberOfLines={6}>{parseStyledContent(item.content)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="images-outline" size={22} color={colors.muted} />
              <Text style={styles.empty}>No posts yet. Create your first post from the Feed tab.</Text>
            </View>
          }
        />
      </View>
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteConfirmVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Delete Post</Text>
            <Text style={styles.modalText}>Delete this post permanently?</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalDangerBtn}
                onPress={() => {
                  const target = deleteTargetPost;
                  setDeleteConfirmVisible(false);
                  setDeleteTargetPost(null);
                  if (target) deletePost(target);
                }}
              >
                <Text style={styles.modalDangerText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
