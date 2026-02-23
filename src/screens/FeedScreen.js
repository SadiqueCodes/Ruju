import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  ImageBackground,
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
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getThemeColors } from '../theme';
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

const FRAME_OPTIONS = [
  { key: 'plain', label: 'Plain', source: null },
  { key: 'frame001', label: 'F1', source: require('../../assets/frames/frame001.jpg') },
  { key: 'frame003', label: 'F2', source: require('../../assets/frames/frame003.jpg') },
  { key: 'frame004', label: 'F3', source: require('../../assets/frames/frame004.jpg') },
  { key: 'frame005', label: 'F4', source: require('../../assets/frames/frame005.jpg') },
  { key: 'frame006', label: 'F5', source: require('../../assets/frames/frame006.jpg') },
  { key: 'frame008', label: 'F6', source: require('../../assets/frames/frame008.jpg') },
  { key: 'frame010', label: 'F7', source: require('../../assets/frames/frame010.jpg') },
  { key: 'frame011', label: 'F8', source: require('../../assets/frames/frame011.jpg') },
  { key: 'frame012', label: 'F9', source: require('../../assets/frames/frame012.jpg') },
  { key: 'frame013', label: 'F10', source: require('../../assets/frames/frame013.jpg') },
  { key: 'frame014', label: 'F11', source: require('../../assets/frames/frame014.jpg') },
  { key: 'frame015', label: 'F12', source: require('../../assets/frames/frame015.jpg') },
  { key: 'frame016', label: 'F13', source: require('../../assets/frames/frame016.jpg') },
  { key: 'frame017', label: 'F14', source: require('../../assets/frames/frame017.jpg') },
  { key: 'frame020', label: 'F15', source: require('../../assets/frames/frame020.jpg') },
  { key: 'frame021', label: 'F16', source: require('../../assets/frames/frame021.jpg') },
  { key: 'frame022', label: 'F17', source: require('../../assets/frames/frame022.jpg') },
  { key: 'frame023', label: 'F18', source: require('../../assets/frames/frame023.jpg') },
  { key: 'frame024', label: 'F19', source: require('../../assets/frames/frame024.jpg') },
  { key: 'frame025', label: 'F20', source: require('../../assets/frames/frame025.jpg') },
  { key: 'frame026', label: 'F21', source: require('../../assets/frames/frame026.jpg') },
  { key: 'frame027', label: 'F22', source: require('../../assets/frames/frame027.jpg') },
  { key: 'frame029', label: 'F23', source: require('../../assets/frames/frame029.jpg') },
  { key: 'frame030', label: 'F24', source: require('../../assets/frames/frame030.jpg') },
  { key: 'frame031', label: 'F25', source: require('../../assets/frames/frame031.jpg') },
  { key: 'frame033', label: 'F26', source: require('../../assets/frames/frame033.jpg') },
  { key: 'frame035', label: 'F27', source: require('../../assets/frames/frame035.jpg') },
];

const DEFAULT_POST_META = {
  styleKey: 'serif',
  frameKey: 'plain',
  textColor: '#111111',
  textScale: 1.0,
};

const TEXT_FIT_OPTIONS = [
  { key: 'xs', label: 'XS', scale: 0.32 },
  { key: 's', label: 'S', scale: 0.45 },
  { key: 'm', label: 'M', scale: 0.58 },
  { key: 'l', label: 'L', scale: 0.72 },
  { key: 'xl', label: 'XL', scale: 1.0 },
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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeHexColor(value) {
  if (!value || typeof value !== 'string') return DEFAULT_POST_META.textColor;
  const cleaned = value.trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(cleaned)) return DEFAULT_POST_META.textColor;
  return cleaned.length === 4
    ? `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`.toUpperCase()
    : cleaned.toUpperCase();
}

function getAutoScaleFromLength(text) {
  const len = String(text || '').trim().length;
  const penalty = clamp((len - 120) / 260, 0, 1);
  return 1 - penalty * 0.28;
}

function buildTextStyle(baseStyle, text, userScale, textColor) {
  const autoScale = getAutoScaleFromLength(text);
  const mergedScale = clamp((Number(userScale) || 1) * autoScale, 0.36, 1.6);
  const baseFont = baseStyle?.fontSize || 20;
  const baseLine = baseStyle?.lineHeight || Math.round(baseFont * 1.35);
  const baseLetterSpacing = baseStyle?.letterSpacing || 0;
  return {
    ...baseStyle,
    color: normalizeHexColor(textColor),
    fontSize: Math.round(baseFont * mergedScale),
    lineHeight: Math.round(baseLine * mergedScale),
    letterSpacing: baseLetterSpacing ? Number((baseLetterSpacing * mergedScale).toFixed(2)) : 0,
  };
}

function encodeStyledContent(meta, text) {
  const safeMeta = {
    styleKey: (meta?.styleKey || DEFAULT_POST_META.styleKey).toLowerCase(),
    frameKey: (meta?.frameKey || DEFAULT_POST_META.frameKey).toLowerCase(),
    textColor: normalizeHexColor(meta?.textColor),
    textScale: clamp(Number(meta?.textScale) || 1, 0.45, 1.6),
  };
  const packed = [
    `style=${safeMeta.styleKey}`,
    `frame=${safeMeta.frameKey}`,
    `color=${safeMeta.textColor}`,
    `scale=${safeMeta.textScale.toFixed(2)}`,
  ].join(';');
  return `[[post:${packed}]]\n${text}`;
}

function parseStyledContent(raw) {
  const text = raw || '';
  const meta = { ...DEFAULT_POST_META };
  const match = text.match(/^\[\[(post|style):([^\]]+)\]\]\n?/i);
  if (!match) return { ...meta, text };

  const markerType = (match[1] || '').toLowerCase();
  const packed = (match[2] || '').trim();
  const body = text.replace(match[0], '');

  if (markerType === 'style' && !/[=;|]/.test(packed)) {
    meta.styleKey = packed.toLowerCase() || DEFAULT_POST_META.styleKey;
    return { ...meta, text: body };
  }

  const chunks = packed.split(/[;|]/).map((x) => x.trim()).filter(Boolean);
  for (const chunk of chunks) {
    if (!chunk.includes('=')) {
      if (!meta.styleKey || meta.styleKey === DEFAULT_POST_META.styleKey) {
        meta.styleKey = chunk.toLowerCase();
      }
      continue;
    }
    const [rawK, ...rest] = chunk.split('=');
    const key = String(rawK || '').trim().toLowerCase();
    const value = rest.join('=').trim();
    if (!value) continue;
    if (key === 'style') meta.styleKey = value.toLowerCase();
    if (key === 'frame') meta.frameKey = value.toLowerCase();
    if (key === 'color') meta.textColor = normalizeHexColor(value);
    if (key === 'scale') meta.textScale = clamp(Number(value) || 1, 0.45, 1.6);
  }

  return { ...meta, text: body };
}

function getStyle(styleKey) {
  return POST_STYLES.find((x) => x.key === styleKey) || POST_STYLES[0];
}

function getFrame(frameKey) {
  const raw = String(frameKey || '').toLowerCase().trim();
  const legacy = raw.match(/^frame(\d{1,2})$/);
  if (legacy) {
    const n = Number(legacy[1]);
    const normalized = `frame${String(n).padStart(3, '0')}`;
    return FRAME_OPTIONS.find((x) => x.key === normalized) || FRAME_OPTIONS[0];
  }
  return FRAME_OPTIONS.find((x) => x.key === raw) || FRAME_OPTIONS[0];
}

function getFrameTextLayout(frameKey) {
  const key = String(frameKey || 'plain').toLowerCase();
  const numeric = key.match(/^frame(\d{1,3})$/);
  const frameNum = numeric ? Number(numeric[1]) : 0;
  if (key === 'plain') {
    return { widthPct: 90, heightPct: 90, padH: 26, padV: 26, circle: false, maxLines: 18 };
  }
  if ([10, 11, 12, 26, 27, 29].includes(frameNum)) {
    return { widthPct: 74, heightPct: 74, padH: 12, padV: 12, circle: true, maxLines: 12 };
  }
  if ([7, 8, 9, 18, 19, 20, 21].includes(frameNum)) {
    return { widthPct: 82, heightPct: 82, padH: 18, padV: 18, circle: false, maxLines: 14 };
  }
  return { widthPct: 86, heightPct: 86, padH: 22, padV: 22, circle: false, maxLines: 16 };
}

function PostCard({ post, like, latestComment, onLike, onDoubleTapLike, onOpenComments, onMenu, captureRef, colors, isLight }) {
  const parsed = parseStyledContent(post.content);
  const stylePreset = getStyle(parsed.styleKey);
  const frame = getFrame(parsed.frameKey);
  const frameTextLayout = useMemo(() => getFrameTextLayout(frame.key), [frame.key]);
  const effectiveTextStyle = useMemo(
    () => buildTextStyle(stylePreset.textStyle, parsed.text, parsed.textScale, parsed.textColor),
    [stylePreset.textStyle, parsed.text, parsed.textScale, parsed.textColor]
  );
  const lastTapRef = useRef(0);
  const heartAnim = useRef(new Animated.Value(0)).current;

  function playHeart() {
    heartAnim.setValue(0);
    Animated.timing(heartAnim, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  function onSquarePress() {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;
    if (delta < 280) {
      if (!like.mine) onDoubleTapLike?.();
      playHeart();
    }
  }

  return (
    <View style={[styles.postWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <View style={styles.authorRow}>
          <Text style={[styles.author, { color: colors.text }]}>{post.author_name || 'Anonymous'}</Text>
          <Text style={[styles.time, { color: colors.muted }]}>| {ago(post.created_at)}</Text>
        </View>
        <Pressable onPress={onMenu} style={styles.menuBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
        </Pressable>
      </View>

      <Pressable onPress={onSquarePress}>
        <ViewShot ref={captureRef} options={{ format: 'jpg', quality: 0.92 }}>
          {frame.source ? (
            <ImageBackground source={frame.source} style={styles.square} imageStyle={styles.squareImage}>
              <View style={styles.squareTextLayer}>
                <View
                  style={[
                    styles.squareTextSafe,
                    frameTextLayout.circle && styles.squareTextSafeCircle,
                    {
                      width: `${frameTextLayout.widthPct}%`,
                      height: `${frameTextLayout.heightPct}%`,
                      paddingHorizontal: frameTextLayout.padH,
                      paddingVertical: frameTextLayout.padV,
                    },
                  ]}
                >
                  <Text style={[styles.squareText, effectiveTextStyle]} numberOfLines={frameTextLayout.maxLines}>{parsed.text}</Text>
                </View>
              </View>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.heartOverlay,
                  {
                    opacity: heartAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.95, 0] }),
                    transform: [
                      { scale: heartAnim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.5, 1.15, 1.35] }) },
                      { translateY: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [6, -16] }) },
                    ],
                  },
                ]}
              >
                <Ionicons name="heart" size={74} color="rgba(238,76,96,0.92)" />
              </Animated.View>
            </ImageBackground>
          ) : (
            <View style={styles.square}>
              <View style={styles.squareTextLayer}>
                <View
                  style={[
                    styles.squareTextSafe,
                    frameTextLayout.circle && styles.squareTextSafeCircle,
                    {
                      width: `${frameTextLayout.widthPct}%`,
                      height: `${frameTextLayout.heightPct}%`,
                      paddingHorizontal: frameTextLayout.padH,
                      paddingVertical: frameTextLayout.padV,
                    },
                  ]}
                >
                  <Text style={[styles.squareText, effectiveTextStyle]} numberOfLines={frameTextLayout.maxLines}>{parsed.text}</Text>
                </View>
              </View>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.heartOverlay,
                  {
                    opacity: heartAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.95, 0] }),
                    transform: [
                      { scale: heartAnim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.5, 1.15, 1.35] }) },
                      { translateY: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [6, -16] }) },
                    ],
                  },
                ]}
              >
                <Ionicons name="heart" size={74} color="rgba(238,76,96,0.92)" />
              </Animated.View>
            </View>
          )}
        </ViewShot>
      </Pressable>

      <View style={styles.rowActions}>
        <Pressable onPress={onLike} style={[styles.badge, { borderColor: colors.border, backgroundColor: isLight ? '#EEF3FF' : '#0E1526' }, like.mine && styles.badgeLiked, like.mine && { borderColor: colors.gold, backgroundColor: isLight ? '#FFF3DA' : '#241D12' }]}>
          <Text style={[styles.badgeText, { color: colors.text }, like.mine && styles.badgeTextLiked, like.mine && { color: colors.gold }]}>{like.mine ? 'Liked' : 'Like'} {like.count}</Text>
        </Pressable>
        <Pressable onPress={onOpenComments} style={[styles.badge, { borderColor: colors.border, backgroundColor: isLight ? '#EEF3FF' : '#0E1526' }]}><Text style={[styles.badgeText, { color: colors.text }]}>Comment</Text></Pressable>
      </View>

      {latestComment ? (
        <Pressable onPress={onOpenComments} style={[styles.latestCommentBox, { borderTopColor: colors.border }]}>
          <Text style={[styles.latestCommentText, { color: colors.text }]}><Text style={[styles.commentAuthor, { color: colors.accent }]}>{latestComment.author_name || 'User'}: </Text>{latestComment.content}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CommentRow({ item, like, replies, expanded, onToggleLike, onReply, onReplyToReply, onToggleExpand, colors }) {
  const visibleReplies = expanded ? replies : replies.slice(-1);
  const hasReplies = replies.length > 0;
  return (
    <View style={[styles.commentRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.commentLine, { color: colors.text }]}><Text style={[styles.commentAuthor, { color: colors.accent }]}>{item.author_name || 'User'}: </Text>{item.content}</Text>
      <View style={styles.commentActions}>
        <Pressable onPress={onToggleLike}><Text style={[styles.commentActionText, { color: colors.muted }]}>{like.mine ? `Liked ${like.count}` : `Like ${like.count}`}</Text></Pressable>
        <Pressable onPress={onReply}><Text style={[styles.commentActionText, { color: colors.muted }]}>Reply</Text></Pressable>
        {hasReplies && !expanded ? <Pressable onPress={onToggleExpand}><Text style={[styles.commentActionText, { color: colors.muted }]}>View {replies.length} repl{replies.length === 1 ? 'y' : 'ies'}</Text></Pressable> : null}
        {hasReplies && expanded ? <Pressable onPress={onToggleExpand}><Text style={[styles.commentActionText, { color: colors.muted }]}>Hide replies</Text></Pressable> : null}
      </View>
      {visibleReplies.map((reply) => (
        <View key={reply.id} style={styles.replyItem}>
          <Text style={[styles.replyLine, { color: colors.text }]}><Text style={[styles.commentAuthor, { color: colors.accent }]}>{reply.author_name || 'User'}: </Text>{reply.content}</Text>
          <Pressable onPress={() => onReplyToReply(reply)}><Text style={[styles.replyActionText, { color: colors.muted }]}>Reply</Text></Pressable>
        </View>
      ))}
    </View>
  );
}

export function FeedScreen() {
  const { profileName, deviceId, themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  const isLight = themeMode === 'light';
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [likesByPost, setLikesByPost] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentLikesById, setCommentLikesById] = useState({});
  const [repliesByComment, setRepliesByComment] = useState({});
  const [expandedRepliesByComment, setExpandedRepliesByComment] = useState({});

  const [postModalMounted, setPostModalMounted] = useState(false);
  const [compose, setCompose] = useState('');
  const [composeStyleKey, setComposeStyleKey] = useState('serif');
  const [composeFrameKey, setComposeFrameKey] = useState('plain');
  const [composeTextScale, setComposeTextScale] = useState(1.0);

  const [commentModalMounted, setCommentModalMounted] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);

  const [menuPost, setMenuPost] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTargetPost, setDeleteTargetPost] = useState(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

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

  const checkInternet = useCallback(async () => {
    try {
      const net = await Network.getNetworkStateAsync();
      const connected = !!net.isConnected && net.isInternetReachable !== false;
      setIsOffline(!connected);
      return connected;
    } catch (_e) {
      return true;
    }
  }, []);

  const loadFeed = useCallback(async ({ showLoader = true } = {}) => {
    const connected = await checkInternet();
    if (!connected) {
      if (showLoader) setLoading(false);
      setPosts([]);
      setLikesByPost({});
      setCommentsByPost({});
      setCommentLikesById({});
      setRepliesByComment({});
      setHasNewPosts(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      if (showLoader) setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    const postsData = await fetchPostsBase();
    setPosts(postsData);

    const postIds = postsData.map((p) => p.id);
    if (!postIds.length) {
      setLikesByPost({});
      setCommentsByPost({});
      setCommentLikesById({});
      setRepliesByComment({});
      if (showLoader) setLoading(false);
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
      if (showLoader) setLoading(false);
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
    if (showLoader) setLoading(false);
    setHasNewPosts(false);
  }, [deviceId, checkInternet]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (!supabase) return undefined;

    const id = setInterval(async () => {
      const connected = await checkInternet();
      if (!connected) return;
      const latest = await fetchPostsBase();
      const newest = latest[0];
      if (!newest || !posts[0]) return;
      if (newest.id !== posts[0].id && new Date(newest.created_at).getTime() > new Date(posts[0].created_at).getTime()) {
        setHasNewPosts(true);
      }
    }, 20000);

    return () => clearInterval(id);
  }, [posts, checkInternet]);

  const canPost = useMemo(() => !!compose.trim() && !!profileName, [compose, profileName]);
  const composeStyle = useMemo(() => getStyle(composeStyleKey), [composeStyleKey]);
  const composeFrame = useMemo(() => getFrame(composeFrameKey), [composeFrameKey]);
  const composeFrameTextLayout = useMemo(() => getFrameTextLayout(composeFrame.key), [composeFrame.key]);
  const composeInputTextStyle = useMemo(() => {
    return {
      fontFamily: composeStyle.textStyle?.fontFamily,
      fontStyle: composeStyle.textStyle?.fontStyle,
      fontWeight: composeStyle.textStyle?.fontWeight,
      textTransform: composeStyle.textStyle?.textTransform,
      color: colors.text,
    };
  }, [composeStyle.textStyle, colors.text]);
  const composePreviewTextStyle = useMemo(
    () => buildTextStyle(composeStyle.textStyle, compose, composeTextScale, DEFAULT_POST_META.textColor),
    [composeStyle.textStyle, compose, composeTextScale]
  );

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
    setExpandedRepliesByComment({});
    setCommentModalMounted(true);
    requestAnimationFrame(() => {
      Animated.timing(commentAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }

  function closeCommentModal() {
    Animated.timing(commentAnim, { toValue: 0, duration: 170, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        setCommentModalMounted(false);
        setReplyTarget(null);
        setExpandedRepliesByComment({});
      }
    });
  }

  async function createPost() {
    if (!canPost || !supabase) return;
    setPosting(true);

    const payload = {
      author_name: profileName,
      content: encodeStyledContent(
        {
          styleKey: composeStyleKey,
          frameKey: composeFrameKey,
          textColor: DEFAULT_POST_META.textColor,
          textScale: composeTextScale,
        },
        compose.trim()
      ),
      author_device_id: deviceId,
    };

    const insert = await supabase.from('feed_posts').insert(payload);
    if (insert.error) {
      await supabase.from('feed_posts').insert({ author_name: profileName, content: payload.content });
    }

    setCompose('');
    setComposeStyleKey('serif');
    setComposeFrameKey('plain');
    setComposeTextScale(1.0);
    closePostModal();
    await loadFeed({ showLoader: false });
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
    await loadFeed({ showLoader: false });
  }

  async function sendCommentOrReply() {
    if (!supabase || !profileName || !commentInput.trim() || !activePost) return;
    let text = commentInput.trim();
    if (replyTarget?.replyToName) {
      const mention = `@${replyTarget.replyToName}`;
      if (!text.toLowerCase().startsWith(mention.toLowerCase())) {
        text = `${mention} ${text}`;
      }
    }
    setCommentInput('');

    if (replyTarget) {
      await supabase.from('feed_comment_replies').insert({ comment_id: replyTarget.id, author_name: profileName, content: text });
    } else {
      await supabase.from('feed_comments').insert({ post_id: activePost.id, author_name: profileName, content: text });
    }

    setReplyTarget(null);
    await loadFeed({ showLoader: false });
  }

  async function toggleCommentLike(commentId) {
    if (!supabase || !deviceId) return;
    const mine = !!commentLikesById[commentId]?.mine;
    if (mine) {
      await supabase.from('feed_comment_likes').delete().eq('comment_id', commentId).eq('device_id', deviceId);
    } else {
      await supabase.from('feed_comment_likes').insert({ comment_id: commentId, device_id: deviceId });
    }
    await loadFeed({ showLoader: false });
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
      const msg = del.error.message || 'Could not delete post';
      if (/policy|permission|42501/i.test(msg)) {
        Alert.alert('Delete blocked by policy', 'Run feed delete policy SQL, then try again.');
      } else {
        Alert.alert('Delete failed', msg);
      }
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setLikesByPost((prev) => {
      const next = { ...prev };
      delete next[post.id];
      return next;
    });
    setCommentsByPost((prev) => {
      const next = { ...prev };
      delete next[post.id];
      return next;
    });
    if (activePost?.id === post.id) {
      closeCommentModal();
      setActivePost(null);
    }
    await loadFeed({ showLoader: false });
  }

  function openMenu(post) {
    setMenuPost(post);
    setMenuVisible(true);
  }

  const activeComments = activePost ? commentsByPost[activePost.id] || [] : [];

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.container}>
          <Text style={[styles.heading, { color: colors.text }]}>Feed</Text>
          <View style={[styles.warnBox, { borderColor: colors.gold, backgroundColor: themeMode === 'light' ? '#FFF4DB' : '#2A1F12' }]}>
            <Text style={[styles.warnTitle, { color: colors.gold }]}>Supabase not configured</Text>
            <Text style={[styles.warnText, { color: colors.text }]}>Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.heading, { color: colors.text }]}>Feed</Text>
          <Pressable style={[styles.newBtnShell, { backgroundColor: colors.gold }]} onPress={openPostModal}>
            <View style={[styles.newBtnInner, { backgroundColor: themeMode === 'light' ? '#FFFFFF' : '#0F1729', borderColor: themeMode === 'light' ? '#D7C6A2' : '#4B402C' }]}><Text style={[styles.newBtnText, { color: colors.gold }]}>NEW POST</Text></View>
          </Pressable>
        </View>

        {isOffline ? (
          <View style={[styles.warnBox, { borderColor: '#C76A6A', backgroundColor: themeMode === 'light' ? '#FFEDED' : '#2A1414' }]}>
            <Text style={[styles.warnTitle, { color: themeMode === 'light' ? '#A94848' : '#E69393' }]}>No internet connection</Text>
            <Text style={[styles.warnText, { color: colors.text }]}>Please turn on your internet to load feed posts.</Text>
            <Pressable
              style={[styles.retryBtn, { borderColor: colors.border, backgroundColor: themeMode === 'light' ? '#FFFFFF' : '#141E31' }]}
              onPress={() => loadFeed()}
            >
              <Text style={[styles.retryBtnText, { color: colors.text }]}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        {!isOffline && hasNewPosts ? (
          <Pressable style={[styles.refreshBanner, { backgroundColor: themeMode === 'light' ? '#E8F1FF' : '#1A2D4A', borderColor: themeMode === 'light' ? '#B7CAE8' : '#355179' }]} onPress={loadFeed}>
            <Text style={[styles.refreshBannerText, { color: colors.text }]}>New posts available. Swipe down to refresh.</Text>
          </Pressable>
        ) : null}

        {!isOffline ? (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={loading && posts.length > 0} onRefresh={loadFeed} tintColor={colors.gold} />}
            ListEmptyComponent={loading ? <ActivityIndicator color={colors.gold} /> : <Text style={[styles.empty, { color: colors.muted }]}>No posts yet.</Text>}
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
                  onDoubleTapLike={() => toggleLike(item.id)}
                  onOpenComments={() => openCommentModal(item)}
                  onMenu={() => openMenu(item)}
                  captureRef={(r) => { if (r) captureRefs.current[item.id] = r; }}
                  colors={colors}
                  isLight={isLight}
                />
              );
            }}
          />
        ) : null}
      </View>

      {savedToast ? (
        <View style={[styles.toast, { backgroundColor: isLight ? '#E9F8EC' : '#163227', borderColor: isLight ? '#5AAA7A' : '#2E7A57' }]}>
          <Text style={[styles.toastText, { color: isLight ? '#1D5A39' : '#D8F8E8' }]}>Saved to gallery</Text>
        </View>
      ) : null}

      <Modal visible={postModalMounted} transparent animationType="none" onRequestClose={closePostModal}>
        <Animated.View style={[styles.overlay, { opacity: postAnim }]}> 
          <Animated.View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border, opacity: postAnim, transform: [{ translateY: postAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Create Post</Text>
            <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
              <TextInput
                value={compose}
                onChangeText={setCompose}
                style={[
                  styles.composeInput,
                  composeInputTextStyle,
                  {
                    borderColor: colors.border,
                    backgroundColor: isLight ? '#F2F6FF' : '#0E1526',
                    color: colors.text,
                    textAlign: 'left',
                  },
                ]}
                multiline
                maxLength={300}
                placeholder="Write your post text"
                placeholderTextColor={colors.muted}
              />
              <Text style={[styles.countText, { color: colors.muted }]}>{compose.length}/300</Text>

              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Font Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontRow}>
                {POST_STYLES.map((item) => (
                  <Pressable key={item.key} onPress={() => setComposeStyleKey(item.key)} style={[styles.fontChip, { borderColor: colors.border, backgroundColor: isLight ? '#EEF3FF' : '#0E1526' }, composeStyleKey === item.key && styles.fontChipActive, composeStyleKey === item.key && { borderColor: colors.gold, backgroundColor: isLight ? '#FFF3DA' : '#241D12' }]}>
                    <Text style={[styles.fontChipText, { color: colors.text }, composeStyleKey === item.key && styles.fontChipTextActive, composeStyleKey === item.key && { color: colors.gold }]}>{item.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Frame</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.frameRow}>
                {FRAME_OPTIONS.map((frame) => (
                  <Pressable
                    key={frame.key}
                    onPress={() => setComposeFrameKey(frame.key)}
                    style={[
                      styles.frameChip,
                      { borderColor: colors.border, backgroundColor: isLight ? '#EEF3FF' : '#0E1526' },
                      composeFrameKey === frame.key && { borderColor: colors.gold, backgroundColor: isLight ? '#FFF3DA' : '#241D12' },
                    ]}
                  >
                    {frame.source ? (
                      <Image source={frame.source} style={styles.frameThumb} />
                    ) : (
                      <View style={[styles.frameThumb, styles.frameThumbPlain]} />
                    )}
                    <Text style={[styles.frameLabel, { color: colors.text }]}>{frame.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Preview</Text>
              <View style={[styles.previewBox, { borderColor: colors.border }]}>
                {composeFrame.source ? (
                  <ImageBackground source={composeFrame.source} style={styles.previewSquare} imageStyle={styles.squareImage}>
                    <View style={styles.squareTextLayer}>
                      <View
                        style={[
                          styles.squareTextSafe,
                          composeFrameTextLayout.circle && styles.squareTextSafeCircle,
                          {
                            width: `${composeFrameTextLayout.widthPct}%`,
                            height: `${composeFrameTextLayout.heightPct}%`,
                            paddingHorizontal: composeFrameTextLayout.padH,
                            paddingVertical: composeFrameTextLayout.padV,
                          },
                        ]}
                      >
                        <Text style={[styles.previewText, composePreviewTextStyle]} numberOfLines={composeFrameTextLayout.maxLines}>
                          {compose || 'Your post preview appears here.'}
                        </Text>
                      </View>
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={styles.previewSquare}>
                    <View style={styles.squareTextLayer}>
                      <View
                        style={[
                          styles.squareTextSafe,
                          composeFrameTextLayout.circle && styles.squareTextSafeCircle,
                          {
                            width: `${composeFrameTextLayout.widthPct}%`,
                            height: `${composeFrameTextLayout.heightPct}%`,
                            paddingHorizontal: composeFrameTextLayout.padH,
                            paddingVertical: composeFrameTextLayout.padV,
                          },
                        ]}
                      >
                        <Text style={[styles.previewText, composePreviewTextStyle]} numberOfLines={composeFrameTextLayout.maxLines}>
                          {compose || 'Your post preview appears here.'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Fit Text</Text>
              <View style={styles.fitChipRow}>
                {TEXT_FIT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    onPress={() => setComposeTextScale(opt.scale)}
                    style={[
                      styles.fitChip,
                      { borderColor: colors.border, backgroundColor: isLight ? '#EEF3FF' : '#0E1526' },
                      Math.abs(composeTextScale - opt.scale) < 0.001 && { borderColor: colors.gold, backgroundColor: isLight ? '#FFF3DA' : '#241D12' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.fitChipText,
                        { color: colors.text },
                        Math.abs(composeTextScale - opt.scale) < 0.001 && { color: colors.gold },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View style={styles.sheetButtons}>
              <Pressable style={[styles.sheetBtnAlt, { borderColor: colors.border, backgroundColor: isLight ? '#EEF3FF' : 'transparent' }]} onPress={closePostModal}><Text style={[styles.sheetBtnAltText, { color: colors.text }]}>Cancel</Text></Pressable>
              <Pressable style={[styles.sheetBtn, (!canPost || posting) && styles.btnDisabled]} onPress={createPost} disabled={!canPost || posting}>
                {posting ? <ActivityIndicator color="#1E1608" size="small" /> : <Text style={styles.sheetBtnText}>Post</Text>}
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <Modal visible={commentModalMounted} transparent animationType="none" onRequestClose={closeCommentModal}>
        <Animated.View
          style={[
            styles.overlayBottom,
            {
              backgroundColor: isLight ? 'rgba(15,23,42,0.16)' : 'rgba(0,0,0,0.45)',
              opacity: commentAnim,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCommentModal} />
          <Animated.View
            style={[
              styles.commentSheet,
              {
                backgroundColor: isLight ? '#FFFFFF' : colors.card,
                borderColor: colors.border,
                opacity: commentAnim,
                transform: [{ translateY: commentAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
              },
            ]}
          >
            <View style={styles.commentSheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Comments</Text>
              <Pressable onPress={closeCommentModal}><Text style={[styles.closeText, { color: colors.gold }]}>Close</Text></Pressable>
            </View>
            <FlatList
              data={activeComments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentList}
              ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>No comments yet.</Text>}
              renderItem={({ item }) => (
                <CommentRow
                  item={item}
                  like={commentLikesById[item.id] || { count: 0, mine: false }}
                  replies={repliesByComment[item.id] || []}
                  expanded={!!expandedRepliesByComment[item.id]}
                  onToggleLike={() => toggleCommentLike(item.id)}
                  onReply={() =>
                    setReplyTarget({
                      id: item.id,
                      author_name: item.author_name,
                      replyToName: item.author_name || 'user',
                    })
                  }
                  onReplyToReply={(reply) =>
                    setReplyTarget({
                      id: item.id,
                      author_name: item.author_name,
                      replyToName: reply.author_name || 'user',
                    })
                  }
                  onToggleExpand={() =>
                    setExpandedRepliesByComment((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                  colors={colors}
                />
              )}
            />
            {replyTarget ? <Text style={[styles.replyingLabel, { color: colors.accent }]}>Replying to @{replyTarget.replyToName || replyTarget.author_name || 'user'}</Text> : null}
            <View style={[styles.commentComposer, { borderTopColor: colors.border }]}>
              <TextInput style={[styles.commentInput, { borderColor: colors.border, backgroundColor: isLight ? '#F2F6FF' : '#0E1526', color: colors.text }]} value={commentInput} onChangeText={setCommentInput} placeholder={replyTarget ? 'Write a reply' : 'Write a comment'} placeholderTextColor={colors.muted} />
              <Pressable style={[styles.sendBtn, !commentInput.trim() && styles.btnDisabled]} disabled={!commentInput.trim()} onPress={sendCommentOrReply}><Text style={styles.sendBtnText}>Send</Text></Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={async () => { setMenuVisible(false); if (menuPost) await sharePostImage(menuPost.id); }}><Text style={[styles.menuItemText, { color: colors.text }]}>Share as Image</Text></Pressable>
            <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={async () => { setMenuVisible(false); if (menuPost) await savePostImage(menuPost.id); }}><Text style={[styles.menuItemText, { color: colors.text }]}>Save Image</Text></Pressable>
            {menuPost && isMine(menuPost) ? (
              <Pressable
                style={({ pressed }) => [styles.menuItem, { borderBottomColor: colors.border }, pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] }]}
                onPress={() => {
                  setMenuVisible(false);
                  setDeleteTargetPost(menuPost);
                  setDeleteConfirmVisible(true);
                }}
              >
                <Text style={styles.menuItemDanger}>Delete Post</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={deleteConfirmVisible} transparent animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
        <Pressable style={[styles.confirmBackdrop, { backgroundColor: isLight ? 'rgba(10,16,28,0.24)' : 'rgba(0,0,0,0.56)' }]} onPress={() => setDeleteConfirmVisible(false)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Delete Post</Text>
            <Text style={[styles.confirmText, { color: colors.muted }]}>Delete this post permanently?</Text>
            <View style={styles.confirmActions}>
              <Pressable style={[styles.confirmCancelBtn, { borderColor: colors.border, backgroundColor: isLight ? '#F2F4F8' : '#131C2E' }]} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={[styles.confirmCancelText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmDangerBtn, { borderColor: '#784444', backgroundColor: isLight ? '#FFECEC' : '#2A1313' }]}
                onPress={() => {
                  const target = deleteTargetPost;
                  setDeleteConfirmVisible(false);
                  setDeleteTargetPost(null);
                  if (target) deletePost(target);
                }}
              >
                <Text style={styles.confirmDangerText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
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
  square: { width: '100%', aspectRatio: 1, borderRadius: 14, backgroundColor: '#E7E7E7', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  squareImage: { borderRadius: 14, resizeMode: 'cover' },
  squareTextLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareTextSafe: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  squareTextSafeCircle: {
    borderRadius: 999,
  },
  squareText: { color: '#111', textAlign: 'center' },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  retryBtn: { marginTop: 10, borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' },
  retryBtnText: { fontWeight: '700', fontSize: 12 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 12, maxHeight: '92%' },
  sheetScroll: { maxHeight: '82%' },
  sheetScrollContent: { paddingBottom: 4 },
  sheetTitle: { color: COLORS.text, fontWeight: '800', fontSize: 16, marginBottom: 10 },
  composeInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: '#0E1526', color: COLORS.text, minHeight: 110, textAlignVertical: 'top', padding: 10 },
  countText: { marginTop: 4, textAlign: 'right', fontSize: 11, fontWeight: '700' },
  sectionLabel: { marginTop: 10, marginBottom: 6, color: COLORS.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  fontRow: { flexDirection: 'row', gap: 8, paddingRight: 6 },
  frameRow: { flexDirection: 'row', gap: 8, paddingRight: 6 },
  fontChip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: '#0E1526' },
  fontChipActive: { borderColor: COLORS.gold, backgroundColor: '#241D12' },
  fontChipText: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  fontChipTextActive: { color: COLORS.gold },
  frameChip: { borderWidth: 1, borderRadius: 12, padding: 6, width: 72, alignItems: 'center', gap: 4 },
  frameThumb: { width: 58, height: 58, borderRadius: 8, backgroundColor: '#E7E7E7' },
  frameThumbPlain: { borderWidth: 1, borderColor: '#CFCFCF' },
  frameLabel: { fontSize: 11, fontWeight: '700' },
  fitChipRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  fitChip: { borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, minWidth: 44, alignItems: 'center' },
  fitChipText: { fontSize: 12, fontWeight: '800' },
  previewBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: '#E7E7E7', justifyContent: 'center', alignItems: 'center', padding: 10 },
  previewSquare: { width: '100%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#E7E7E7', justifyContent: 'center', alignItems: 'center' },
  previewText: { color: '#111', textAlign: 'center' },
  sheetButtons: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  sheetBtnAlt: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sheetBtnAltText: { color: COLORS.text, fontWeight: '700' },
  sheetBtn: { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  sheetBtnText: { color: '#1E1608', fontWeight: '800' },
  btnDisabled: { opacity: 0.45 },

  commentSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderColor: COLORS.border, maxHeight: '50%', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  commentSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  closeText: { color: COLORS.gold, fontWeight: '700' },
  commentList: { paddingBottom: 8 },
  commentRow: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 9 },
  commentLine: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  commentActions: { flexDirection: 'row', gap: 14, marginTop: 4 },
  commentActionText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  replyItem: { marginTop: 5, marginLeft: 12 },
  replyLine: { marginTop: 0, marginLeft: 0, color: COLORS.text, fontSize: 13 },
  replyActionText: { marginLeft: 0, marginTop: 2, color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  replyingLabel: { color: COLORS.accent, fontWeight: '700', marginBottom: 6 },
  commentComposer: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingTop: 8, marginTop: 2 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, color: COLORS.text, backgroundColor: '#0E1526', paddingHorizontal: 10, paddingVertical: 10 },
  sendBtn: { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  sendBtnText: { color: '#1E1608', fontWeight: '800' },

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', padding: 12 },
  menuSheet: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  menuItem: { paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuItemText: { color: COLORS.text, fontWeight: '700' },
  menuItemDanger: { color: '#E26A6A', fontWeight: '800' },
  confirmBackdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 18 },
  confirmCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  confirmTitle: { fontSize: 16, fontWeight: '800' },
  confirmText: { fontSize: 13, lineHeight: 19 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 2 },
  confirmCancelBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  confirmCancelText: { fontWeight: '700', fontSize: 13 },
  confirmDangerBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  confirmDangerText: { color: '#D96363', fontWeight: '800', fontSize: 13 },

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




