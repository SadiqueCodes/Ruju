import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAppState } from '../state/AppState';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

function ago(iso) {
  if (!iso) return '';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function SquarePost({ post, liked, likeCount, comments, onToggleLike, onComment }) {
  const [commentText, setCommentText] = useState('');

  return (
    <View style={styles.postWrap}>
      <View style={styles.postHeader}>
        <Text style={styles.author}>{post.author_name || 'Anonymous'}</Text>
        <Text style={styles.time}>{ago(post.created_at)}</Text>
      </View>

      <View style={styles.square}>
        <Text style={styles.squareText}>{post.content}</Text>
      </View>

      <View style={styles.rowActions}>
        <Pressable onPress={onToggleLike} style={[styles.badge, liked && styles.badgeLiked]}>
          <Text style={[styles.badgeText, liked && styles.badgeTextLiked]}>
            {liked ? 'Liked' : 'Like'} {likeCount}
          </Text>
        </Pressable>
        <Text style={styles.commentCount}>Comments {comments.length}</Text>
      </View>

      <View style={styles.commentBox}>
        {comments.slice(-4).map((item) => (
          <Text key={item.id} style={styles.commentLine}>
            <Text style={styles.commentAuthor}>{item.author_name || 'User'}: </Text>
            {item.content}
          </Text>
        ))}
      </View>

      <View style={styles.commentComposer}>
        <TextInput
          style={styles.commentInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Write a comment"
          placeholderTextColor={COLORS.muted}
        />
        <Pressable
          style={[styles.postBtnSm, !commentText.trim() && styles.btnDisabled]}
          disabled={!commentText.trim()}
          onPress={async () => {
            const text = commentText.trim();
            setCommentText('');
            await onComment(text);
          }}
        >
          <Text style={styles.postBtnText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function FeedScreen() {
  const { profileName, deviceId } = useAppState();
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [likesByPost, setLikesByPost] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [compose, setCompose] = useState('');

  const loadFeed = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: postsData, error: postsErr } = await supabase
      .from('feed_posts')
      .select('id, author_name, content, created_at')
      .order('created_at', { ascending: false })
      .limit(60);

    if (postsErr || !postsData) {
      setLoading(false);
      return;
    }

    setPosts(postsData);

    const postIds = postsData.map((p) => p.id);
    if (!postIds.length) {
      setLikesByPost({});
      setCommentsByPost({});
      setLoading(false);
      return;
    }

    const [{ data: likesData }, { data: commentsData }] = await Promise.all([
      supabase.from('feed_likes').select('post_id, device_id').in('post_id', postIds),
      supabase
        .from('feed_comments')
        .select('id, post_id, author_name, content, created_at')
        .in('post_id', postIds)
        .order('created_at', { ascending: true }),
    ]);

    const likesMap = {};
    for (const row of likesData || []) {
      if (!likesMap[row.post_id]) likesMap[row.post_id] = { count: 0, mine: false };
      likesMap[row.post_id].count += 1;
      if (row.device_id === deviceId) likesMap[row.post_id].mine = true;
    }

    const commentsMap = {};
    for (const row of commentsData || []) {
      if (!commentsMap[row.post_id]) commentsMap[row.post_id] = [];
      commentsMap[row.post_id].push(row);
    }

    setLikesByPost(likesMap);
    setCommentsByPost(commentsMap);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const canPost = useMemo(() => !!compose.trim() && !!profileName, [compose, profileName]);

  async function createPost() {
    if (!canPost || !supabase) return;
    setPosting(true);
    await supabase.from('feed_posts').insert({ author_name: profileName, content: compose.trim() });
    setCompose('');
    await loadFeed();
    setPosting(false);
  }

  async function toggleLike(postId) {
    if (!supabase || !deviceId) return;
    const mine = !!likesByPost[postId]?.mine;
    if (mine) {
      await supabase.from('feed_likes').delete().eq('post_id', postId).eq('device_id', deviceId);
    } else {
      await supabase.from('feed_likes').insert({ post_id: postId, device_id: deviceId });
    }
    await loadFeed();
  }

  async function addComment(postId, content) {
    if (!supabase || !profileName || !content.trim()) return;
    await supabase.from('feed_comments').insert({
      post_id: postId,
      author_name: profileName,
      content: content.trim(),
    });
    await loadFeed();
  }

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.heading}>Community Feed</Text>
          <View style={styles.warnBox}>
            <Text style={styles.warnTitle}>Supabase not configured</Text>
            <Text style={styles.warnText}>Set `supabaseUrl` and `supabaseAnonKey` in `app.json` under `expo.extra`.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <Text style={styles.heading}>Community Feed</Text>

        <View style={styles.composeWrap}>
          <TextInput
            value={compose}
            onChangeText={setCompose}
            style={styles.composeInput}
            multiline
            placeholder="Create a post..."
            placeholderTextColor={COLORS.muted}
            maxLength={300}
          />
          <Pressable style={[styles.postBtn, (!canPost || posting) && styles.btnDisabled]} onPress={createPost} disabled={!canPost || posting}>
            {posting ? <ActivityIndicator color="#1E1608" size="small" /> : <Text style={styles.postBtnText}>Post</Text>}
          </Pressable>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadFeed} tintColor={COLORS.gold} />}
          ListEmptyComponent={
            loading ? <ActivityIndicator color={COLORS.gold} /> : <Text style={styles.empty}>No posts yet. Be first.</Text>
          }
          renderItem={({ item }) => {
            const like = likesByPost[item.id] || { count: 0, mine: false };
            const comments = commentsByPost[item.id] || [];
            return (
              <SquarePost
                post={item}
                liked={like.mine}
                likeCount={like.count}
                comments={comments}
                onToggleLike={() => toggleLike(item.id)}
                onComment={(text) => addComment(item.id, text)}
              />
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  heading: { color: COLORS.text, fontSize: 26, fontWeight: '800', marginBottom: 10 },
  composeWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#0E1526',
    padding: 10,
    marginBottom: 12,
  },
  composeInput: {
    color: COLORS.text,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  postBtn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  postBtnSm: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  postBtnText: { color: '#1E1608', fontWeight: '800' },
  btnDisabled: { opacity: 0.45 },
  list: { gap: 12, paddingBottom: 34 },
  postWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    backgroundColor: COLORS.card,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  author: { color: COLORS.text, fontWeight: '700' },
  time: { color: COLORS.muted, fontSize: 12 },
  square: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#EDEDED',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  squareText: {
    color: '#111111',
    fontSize: 19,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '600',
  },
  rowActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#0E1526',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeLiked: {
    borderColor: COLORS.gold,
    backgroundColor: '#241D12',
  },
  badgeText: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  badgeTextLiked: { color: COLORS.gold },
  commentCount: { color: COLORS.muted, fontSize: 12 },
  commentBox: { marginTop: 8, gap: 4 },
  commentLine: { color: COLORS.text, fontSize: 13, lineHeight: 18 },
  commentAuthor: { color: COLORS.accent, fontWeight: '700' },
  commentComposer: { marginTop: 8, flexDirection: 'row', gap: 8 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    color: COLORS.text,
    backgroundColor: '#0E1526',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 16 },
  warnBox: {
    borderWidth: 1,
    borderColor: '#6A4D33',
    borderRadius: 14,
    backgroundColor: '#2A1F12',
    padding: 12,
  },
  warnTitle: { color: COLORS.gold, fontWeight: '800', marginBottom: 4 },
  warnText: { color: COLORS.text, lineHeight: 20 },
});
