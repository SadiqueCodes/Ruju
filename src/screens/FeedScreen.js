import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { useAppState } from '../state/AppState';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const FONT_SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const FONT_MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const FONT_CURSIVE = Platform.select({ ios: 'Snell Roundhand', android: 'cursive', default: 'serif' });
const FONT_WIDE = Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-condensed', default: 'System' });
const FONT_SYSTEM = Platform.select({ ios: 'AvenirNext-Bold', android: 'sans-serif-medium', default: 'System' });

const POST_STYLES = [
  { key: 'serif', label: 'Serif', textStyle: { fontSize: 20, lineHeight: 28, fontFamily: FONT_SERIF } },
  { key: 'mono', label: 'Mono', textStyle: { fontSize: 17, lineHeight: 26, fontFamily: FONT_MONO } },
  { key: 'quote', label: 'Quote', textStyle: { fontSize: 20, lineHeight: 28, fontStyle: 'italic', fontWeight: '600', fontFamily: FONT_SERIF } },
  { key: 'classic', label: 'Classic', textStyle: { fontSize: 21, lineHeight: 29, fontWeight: '700', fontFamily: FONT_SERIF } },
  { key: 'cursive', label: 'Cursive', textStyle: { fontSize: 22, lineHeight: 30, fontFamily: FONT_CURSIVE, fontStyle: 'italic' } },
  { key: 'poster', label: 'Poster', textStyle: { fontSize: 24, lineHeight: 30, fontWeight: '900', letterSpacing: 0.4, fontFamily: FONT_SYSTEM } },
  { key: 'airy', label: 'Airy', textStyle: { fontSize: 18, lineHeight: 29, fontWeight: '500', letterSpacing: 0.9, fontFamily: FONT_WIDE } },
  { key: 'neon', label: 'Neon', textStyle: { fontSize: 20, lineHeight: 28, fontWeight: '800', letterSpacing: 1.2, fontFamily: FONT_SYSTEM } },
  { key: 'caps', label: 'Caps', textStyle: { fontSize: 18, lineHeight: 25, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: FONT_WIDE } },
  { key: 'minimal', label: 'Minimal', textStyle: { fontSize: 17, lineHeight: 24, fontWeight: '400', fontFamily: FONT_SYSTEM } },
];

function ago(iso) {
  if (!iso) return '';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function encodeStyledContent(styleKey, text) {
  return `[[style:${styleKey}]]\n${text}`;
}

function parseStyledContent(raw) {
  const text = raw || '';
  const match = text.match(/^\[\[style:([a-z0-9_-]+)\]\]\n?/i);
  if (!match) return { styleKey: 'serif', text };
  return { styleKey: (match[1] || 'serif').toLowerCase(), text: text.replace(match[0], '') };
}

function getStyle(styleKey) {
  return POST_STYLES.find((x) => x.key === styleKey) || POST_STYLES[0];
}

function PostCard({ post, like, latestComment, onLike, onOpenComments, onMenu, captureRef }) {
  const parsed = parseStyledContent(post.content);
  const stylePreset = getStyle(parsed.styleKey);

  return (
    <View style={styles.postWrap}>
      <View style={styles.postHeader}>
        <View style={styles.authorRow}>
          <Text style={styles.author}>{post.author_name || 'Anonymous'}</Text>
          <Text style={styles.time}>| {ago(post.created_at)}</Text>
        </View>
        <Pressable onPress={onMenu} style={styles.menuBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.muted} />
        </Pressable>
      </View>

      <ViewShot ref={captureRef} options={{ format: 'jpg', quality: 0.92 }}>
        <View style={styles.square}>
          <Text style={[styles.squareText, stylePreset.textStyle]}>{parsed.text}</Text>
        </View>
      </ViewShot>

      <View style={styles.rowActions}>
        <Pressable onPress={onLike} style={[styles.badge, like.mine && styles.badgeLiked]}>
          <Text style={[styles.badgeText, like.mine && styles.badgeTextLiked]}>{like.mine ? 'Liked' : 'Like'} {like.count}</Text>
        </Pressable>
        <Pressable onPress={onOpenComments} style={styles.badge}><Text style={styles.badgeText}>Comment</Text></Pressable>
      </View>

      {latestComment ? (
        <View style={styles.latestCommentBox}>
          <Text style={styles.latestCommentText}><Text style={styles.commentAuthor}>{latestComment.author_name || 'User'}: </Text>{latestComment.content}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CommentRow({ item, like, replies, expanded, onToggleLike, onReply, onToggleExpand }) {
  const visibleReplies = expanded ? replies : replies.slice(-2);
  return (
    <View style={styles.commentRow}>
      <Text style={styles.commentLine}><Text style={styles.commentAuthor}>{item.author_name || 'User'}: </Text>{item.content}</Text>
      <View style={styles.commentActions}>
        <Pressable onPress={onToggleLike}><Text style={styles.commentActionText}>{like.mine ? `Liked ${like.count}` : `Like ${like.count}`}</Text></Pressable>
        <Pressable onPress={onReply}><Text style={styles.commentActionText}>Reply</Text></Pressable>
        {replies.length > 2 ? <Pressable onPress={onToggleExpand}><Text style={styles.commentActionText}>{expanded ? 'Hide replies' : `View replies ${replies.length}`}</Text></Pressable> : null}
      </View>
      {visibleReplies.map((reply) => (
        <Text key={reply.id} style={styles.replyLine}><Text style={styles.commentAuthor}>{reply.author_name || 'User'}: </Text>{reply.content}</Text>
      ))}
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
  const [commentLikesById, setCommentLikesById] = useState({});
  const [repliesByComment, setRepliesByComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  const [postModalMounted, setPostModalMounted] = useState(false);
  const [compose, setCompose] = useState('');
  const [composeStyleKey, setComposeStyleKey] = useState('serif');

  const [commentModalMounted, setCommentModalMounted] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);

  const [menuPost, setMenuPost] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const postAnim = useRef(new Animated.Value(0)).current;
  const commentAnim = useRef(new Animated.Value(0)).current;
  const captureRefs = useRef({});

  function isMine(post) {
    if (post.author_device_id) return post.author_device_id === deviceId;
    return (post.author_name || '') === (profileName || '');
  }

  async function fetchPostsBase() {
    if (!supabase) return [];
    const withDevice = await supabase
      .from('feed_posts')
      .select('id, author_name, author_device_id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(80);

    if (withDevice.error) {
      const fallback = await supabase
        .from('feed_posts')
        .select('id, author_name, content, created_at')
        .order('created_at', { ascending: false })
        .limit(80);
      return fallback.data || [];
    }

    return withDevice.data || [];
  }

  const loadFeed = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const postsData = await fetchPostsBase();
    setPosts(postsData);

    const postIds = postsData.map((p) => p.id);
    if (!postIds.length) {
      setLikesByPost({});
      setCommentsByPost({});
      setCommentLikesById({});
      setRepliesByComment({});
      setLoading(false);
      setHasNewPosts(false);
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
    const commentIds = [];
    for (const row of commentsData || []) {
      if (!commentsMap[row.post_id]) commentsMap[row.post_id] = [];
      commentsMap[row.post_id].push(row);
      commentIds.push(row.id);
    }

    setLikesByPost(likesMap);
    setCommentsByPost(commentsMap);

    if (!commentIds.length) {
      setCommentLikesById({});
      setRepliesByComment({});
      setLoading(false);
      setHasNewPosts(false);
      return;
    }

    const [{ data: commentLikes }, { data: replies }] = await Promise.all([
      supabase.from('feed_comment_likes').select('comment_id, device_id').in('comment_id', commentIds),
      supabase
        .from('feed_comment_replies')
        .select('id, comment_id, author_name, content, created_at')
        .in('comment_id', commentIds)
        .order('created_at', { ascending: true }),
    ]);

    const commentLikeMap = {};
    for (const row of commentLikes || []) {
      if (!commentLikeMap[row.comment_id]) commentLikeMap[row.comment_id] = { count: 0, mine: false };
      commentLikeMap[row.comment_id].count += 1;
      if (row.device_id === deviceId) commentLikeMap[row.comment_id].mine = true;
    }

    const repliesMap = {};
    for (const row of replies || []) {
      if (!repliesMap[row.comment_id]) repliesMap[row.comment_id] = [];
      repliesMap[row.comment_id].push(row);
    }

    setCommentLikesById(commentLikeMap);
    setRepliesByComment(repliesMap);
    setLoading(false);
    setHasNewPosts(false);
  }, [deviceId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (!supabase) return undefined;

    const id = setInterval(async () => {
      const latest = await fetchPostsBase();
      const newest = latest[0];
      if (!newest || !posts[0]) return;
      if (newest.id !== posts[0].id && new Date(newest.created_at).getTime() > new Date(posts[0].created_at).getTime()) {
        setHasNewPosts(true);
      }
    }, 20000);

    return () => clearInterval(id);
  }, [posts]);

  const canPost = useMemo(() => !!compose.trim() && !!profileName, [compose, profileName]);
  const composeStyle = useMemo(() => getStyle(composeStyleKey), [composeStyleKey]);

  function openPostModal() {
    setPostModalMounted(true);
    requestAnimationFrame(() => {
      Animated.timing(postAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }

  function closePostModal() {
    Animated.timing(postAnim, { toValue: 0, duration: 170, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setPostModalMounted(false);
    });
  }

  function openCommentModal(post) {
    setActivePost(post);
    setReplyTarget(null);
    setCommentInput('');
    setCommentModalMounted(true);
    requestAnimationFrame(() => {
      Animated.timing(commentAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }

  function closeCommentModal() {
    Animated.timing(commentAnim, { toValue: 0, duration: 170, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setCommentModalMounted(false);
    });
  }

  async function createPost() {
    if (!canPost || !supabase) return;
    setPosting(true);

    const payload = {
      author_name: profileName,
      content: encodeStyledContent(composeStyleKey, compose.trim()),
      author_device_id: deviceId,
    };

    const insert = await supabase.from('feed_posts').insert(payload);
    if (insert.error) {
      await supabase.from('feed_posts').insert({ author_name: profileName, content: payload.content });
    }

    setCompose('');
    setComposeStyleKey('serif');
    closePostModal();
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

  async function sendCommentOrReply() {
    if (!supabase || !profileName || !commentInput.trim() || !activePost) return;
    const text = commentInput.trim();
    setCommentInput('');

    if (replyTarget) {
      await supabase.from('feed_comment_replies').insert({ comment_id: replyTarget.id, author_name: profileName, content: text });
    } else {
      await supabase.from('feed_comments').insert({ post_id: activePost.id, author_name: profileName, content: text });
    }

    setReplyTarget(null);
    await loadFeed();
  }

  async function toggleCommentLike(commentId) {
    if (!supabase || !deviceId) return;
    const mine = !!commentLikesById[commentId]?.mine;
    if (mine) {
      await supabase.from('feed_comment_likes').delete().eq('comment_id', commentId).eq('device_id', deviceId);
    } else {
      await supabase.from('feed_comment_likes').insert({ comment_id: commentId, device_id: deviceId });
    }
    await loadFeed();
  }

  async function savePostImage(postId) {
    const ref = captureRefs.current[postId];
    if (!ref) {
      Alert.alert('Save failed', 'Could not capture this post.');
      return;
    }

    const currentPerm = await MediaLibrary.getPermissionsAsync();
    const perm = currentPerm.granted ? currentPerm : await MediaLibrary.requestPermissionsAsync();
    if (!(perm.status === 'granted' || perm.granted || perm.accessPrivileges === 'all' || perm.accessPrivileges === 'limited')) {
      Alert.alert('Permission needed', 'Please allow media permission to save images.');
      return;
    }

    try {
      const uri = await ref.capture({
        format: 'jpg',
        quality: 0.95,
        result: 'tmpfile',
        fileName: `ruju_post_${Date.now()}`,
      });
      if (!uri) throw new Error('No image generated');

      try {
        await MediaLibrary.saveToLibraryAsync(uri);
      } catch (_primarySaveError) {
        await MediaLibrary.createAssetAsync(uri);
      }

      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1400);
    } catch (e) {
      Alert.alert('Save failed', e?.message || 'Could not save image. Please try again.');
    }
  }

  async function sharePostImage(postId) {
    const ref = captureRefs.current[postId];
    if (!ref) return;
    const uri = await ref.capture();
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
      return;
    }
    await Sharing.shareAsync(uri);
  }

  async function deletePost(post) {
    if (!supabase || !isMine(post)) return;
    const del = await supabase.from('feed_posts').delete().eq('id', post.id);
    if (del.error) {
      Alert.alert('Delete failed', del.error.message || 'Could not delete post');
      return;
    }
    await loadFeed();
  }

  function openMenu(post) {
    setMenuPost(post);
    setMenuVisible(true);
  }

  const activeComments = activePost ? commentsByPost[activePost.id] || [] : [];

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.container}>
          <Text style={styles.heading}>Feed</Text>
          <View style={styles.warnBox}>
            <Text style={styles.warnTitle}>Supabase not configured</Text>
            <Text style={styles.warnText}>Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Feed</Text>
          <Pressable style={styles.newBtnShell} onPress={openPostModal}>
            <View style={styles.newBtnInner}><Text style={styles.newBtnText}>NEW POST</Text></View>
          </Pressable>
        </View>

        {hasNewPosts ? (
          <Pressable style={styles.refreshBanner} onPress={loadFeed}>
            <Text style={styles.refreshBannerText}>New posts available. Swipe down to refresh.</Text>
          </Pressable>
        ) : null}

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadFeed} tintColor={COLORS.gold} />}
          ListEmptyComponent={loading ? <ActivityIndicator color={COLORS.gold} /> : <Text style={styles.empty}>No posts yet.</Text>}
          renderItem={({ item }) => {
            const like = likesByPost[item.id] || { count: 0, mine: false };
            const comments = commentsByPost[item.id] || [];
            const latestComment = comments.length ? comments[comments.length - 1] : null;
            return (
              <PostCard
                post={item}
                like={like}
                latestComment={latestComment}
                onLike={() => toggleLike(item.id)}
                onOpenComments={() => openCommentModal(item)}
                onMenu={() => openMenu(item)}
                captureRef={(r) => { if (r) captureRefs.current[item.id] = r; }}
              />
            );
          }}
        />
      </View>

      {savedToast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Saved to gallery</Text>
        </View>
      ) : null}

      <Modal visible={postModalMounted} transparent animationType="none" onRequestClose={closePostModal}>
        <Animated.View style={[styles.overlay, { opacity: postAnim }]}> 
          <Animated.View style={[styles.sheet, { opacity: postAnim, transform: [{ translateY: postAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
            <Text style={styles.sheetTitle}>Create Post</Text>
            <TextInput value={compose} onChangeText={setCompose} style={styles.composeInput} multiline maxLength={300} placeholder="Write your post text" placeholderTextColor={COLORS.muted} />
            <Text style={styles.sectionLabel}>Font Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontRow}>
              {POST_STYLES.map((item) => (
                <Pressable key={item.key} onPress={() => setComposeStyleKey(item.key)} style={[styles.fontChip, composeStyleKey === item.key && styles.fontChipActive]}>
                  <Text style={[styles.fontChipText, composeStyleKey === item.key && styles.fontChipTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.sectionLabel}>Preview</Text>
            <View style={styles.previewBox}><Text style={[styles.previewText, composeStyle.textStyle]}>{compose || 'Your post preview appears here.'}</Text></View>
            <View style={styles.sheetButtons}>
              <Pressable style={styles.sheetBtnAlt} onPress={closePostModal}><Text style={styles.sheetBtnAltText}>Cancel</Text></Pressable>
              <Pressable style={[styles.sheetBtn, (!canPost || posting) && styles.btnDisabled]} onPress={createPost} disabled={!canPost || posting}>
                {posting ? <ActivityIndicator color="#1E1608" size="small" /> : <Text style={styles.sheetBtnText}>Post</Text>}
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <Modal visible={commentModalMounted} transparent animationType="none" onRequestClose={closeCommentModal}>
        <Animated.View style={[styles.overlayBottom, { opacity: commentAnim }]}> 
          <Animated.View style={[styles.commentSheet, { opacity: commentAnim, transform: [{ translateY: commentAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] }]}>
            <View style={styles.commentSheetHeader}>
              <Text style={styles.sheetTitle}>Comments</Text>
              <Pressable onPress={closeCommentModal}><Text style={styles.closeText}>Close</Text></Pressable>
            </View>
            <FlatList
              data={activeComments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentList}
              ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
              renderItem={({ item }) => (
                <CommentRow
                  item={item}
                  like={commentLikesById[item.id] || { count: 0, mine: false }}
                  replies={repliesByComment[item.id] || []}
                  expanded={!!expandedComments[item.id]}
                  onToggleLike={() => toggleCommentLike(item.id)}
                  onReply={() => setReplyTarget(item)}
                  onToggleExpand={() => setExpandedComments((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                />
              )}
            />
            {replyTarget ? <Text style={styles.replyingLabel}>Replying to {replyTarget.author_name || 'User'}</Text> : null}
            <View style={styles.commentComposer}>
              <TextInput style={styles.commentInput} value={commentInput} onChangeText={setCommentInput} placeholder={replyTarget ? 'Write a reply' : 'Write a comment'} placeholderTextColor={COLORS.muted} />
              <Pressable style={[styles.sendBtn, !commentInput.trim() && styles.btnDisabled]} disabled={!commentInput.trim()} onPress={sendCommentOrReply}><Text style={styles.sendBtnText}>Send</Text></Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <Pressable style={styles.menuItem} onPress={async () => { setMenuVisible(false); if (menuPost) await sharePostImage(menuPost.id); }}><Text style={styles.menuItemText}>Share as Image</Text></Pressable>
            <Pressable style={styles.menuItem} onPress={async () => { setMenuVisible(false); if (menuPost) await savePostImage(menuPost.id); }}><Text style={styles.menuItemText}>Save Image</Text></Pressable>
            {menuPost && isMine(menuPost) ? (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  Alert.alert('Delete Post', 'Delete this post permanently?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deletePost(menuPost) },
                  ]);
                }}
              >
                <Text style={styles.menuItemDanger}>Delete Post</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heading: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  refreshBanner: { backgroundColor: '#1A2D4A', borderColor: '#355179', borderWidth: 1, borderRadius: 10, padding: 8, marginBottom: 8 },
  refreshBannerText: { color: COLORS.text, fontSize: 12, textAlign: 'center' },

  newBtnShell: { borderRadius: 999, padding: 1.5, backgroundColor: COLORS.gold },
  newBtnInner: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#0F1729', borderWidth: 1, borderColor: '#4B402C' },
  newBtnText: { color: COLORS.gold, fontWeight: '800', fontSize: 11, letterSpacing: 0.9 },

  list: { gap: 10, paddingBottom: 28 },
  postWrap: { borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 10, backgroundColor: COLORS.card },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  author: { color: COLORS.text, fontWeight: '700' },
  time: { color: COLORS.muted, fontSize: 12 },
  menuBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  square: { width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: '#E7E7E7', justifyContent: 'center', alignItems: 'center', padding: 18 },
  squareText: { color: '#111', textAlign: 'center' },
  rowActions: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#0E1526', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeLiked: { borderColor: COLORS.gold, backgroundColor: '#241D12' },
  badgeText: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  badgeTextLiked: { color: COLORS.gold },
  latestCommentBox: { marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8 },
  latestCommentText: { color: COLORS.text, fontSize: 13 },
  commentAuthor: { color: COLORS.accent, fontWeight: '700' },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 16 },
  warnBox: { borderWidth: 1, borderColor: '#6A4D33', borderRadius: 14, backgroundColor: '#2A1F12', padding: 12 },
  warnTitle: { color: COLORS.gold, fontWeight: '800', marginBottom: 4 },
  warnText: { color: COLORS.text, lineHeight: 20 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 12 },
  sheetTitle: { color: COLORS.text, fontWeight: '800', fontSize: 16, marginBottom: 10 },
  composeInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: '#0E1526', color: COLORS.text, minHeight: 110, textAlignVertical: 'top', padding: 10 },
  sectionLabel: { marginTop: 10, marginBottom: 6, color: COLORS.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  fontRow: { flexDirection: 'row', gap: 8, paddingRight: 6 },
  fontChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: '#0E1526' },
  fontChipActive: { borderColor: COLORS.gold, backgroundColor: '#241D12' },
  fontChipText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  fontChipTextActive: { color: COLORS.gold },
  previewBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: '#E7E7E7', minHeight: 120, justifyContent: 'center', alignItems: 'center', padding: 12 },
  previewText: { color: '#111', textAlign: 'center' },
  sheetButtons: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  sheetBtnAlt: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sheetBtnAltText: { color: COLORS.text, fontWeight: '700' },
  sheetBtn: { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sheetBtnText: { color: '#1E1608', fontWeight: '800' },
  btnDisabled: { opacity: 0.45 },

  commentSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderColor: COLORS.border, maxHeight: '80%', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  commentSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  closeText: { color: COLORS.gold, fontWeight: '700' },
  commentList: { paddingBottom: 8 },
  commentRow: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 9 },
  commentLine: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  commentActions: { flexDirection: 'row', gap: 14, marginTop: 4 },
  commentActionText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  replyLine: { marginTop: 5, marginLeft: 12, color: COLORS.text, fontSize: 13 },
  replyingLabel: { color: COLORS.accent, fontWeight: '700', marginBottom: 6 },
  commentComposer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, color: COLORS.text, backgroundColor: '#0E1526', paddingHorizontal: 10, paddingVertical: 10 },
  sendBtn: { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  sendBtnText: { color: '#1E1608', fontWeight: '800' },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', padding: 12 },
  menuSheet: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  menuItem: { paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuItemText: { color: COLORS.text, fontWeight: '700' },
  menuItemDanger: { color: '#E26A6A', fontWeight: '800' },

  toast: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    zIndex: 90,
    backgroundColor: '#163227',
    borderColor: '#2E7A57',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toastText: { color: '#D8F8E8', fontWeight: '700', fontSize: 12 },
});
