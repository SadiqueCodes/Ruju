import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ayahRows from '../../ayahs_formatted.json';
import { buildQuranIndex } from '../utils/quranData';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const STORAGE_BOOKMARKS = 'ruju.bookmarks.v1';
const STORAGE_LAST_READ = 'ruju.lastRead.v1';
const STORAGE_PROFILE_NAME = 'ruju.profileName.v1';
const STORAGE_PROFILE_GENDER = 'ruju.profileGender.v1';
const STORAGE_DEVICE_ID = 'ruju.deviceId.v1';
const STORAGE_THEME_MODE = 'ruju.themeMode.v1';

const AppStateContext = createContext(null);

function makeAyahKey(surahNumber, ayahNumber) {
  return `${surahNumber}:${ayahNumber}`;
}

function pickRicherText(prevText, nextText) {
  const a = String(prevText || '').trim();
  const b = String(nextText || '').trim();
  if (!a) return b;
  if (!b) return a;
  const aNorm = a.replace(/\s+/g, ' ').toLowerCase();
  const bNorm = b.replace(/\s+/g, ' ').toLowerCase();
  if (aNorm === bNorm) return a.length >= b.length ? a : b;
  if (aNorm.includes(bNorm)) return a;
  if (bNorm.includes(aNorm)) return b;
  return a.length >= b.length ? a : b;
}

function mergeAyahRows(localRows, remoteRows) {
  if (!Array.isArray(remoteRows) || remoteRows.length === 0) return localRows;

  const remoteSurahNameCounts = new Map();
  for (const row of remoteRows) {
    if (!row || !Number.isInteger(row.surah_number)) continue;
    const remoteName = String(row.surah_name || '').trim();
    if (!remoteName) continue;

    if (!remoteSurahNameCounts.has(row.surah_number)) {
      remoteSurahNameCounts.set(row.surah_number, new Map());
    }
    const countMap = remoteSurahNameCounts.get(row.surah_number);
    countMap.set(remoteName, (countMap.get(remoteName) || 0) + 1);
  }

  const remoteSurahNames = new Map();
  for (const [surahNumber, countMap] of remoteSurahNameCounts.entries()) {
    const best = Array.from(countMap.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      if (b[0].length !== a[0].length) return b[0].length - a[0].length;
      return a[0].localeCompare(b[0]);
    })[0];
    if (best && best[0]) remoteSurahNames.set(surahNumber, best[0]);
  }

  const merged = new Map();
  for (const row of localRows || []) {
    if (!row || !Number.isInteger(row.surah_number) || !Number.isInteger(row.ayah_number)) continue;
    const forcedSurahName = remoteSurahNames.get(row.surah_number);
    merged.set(makeAyahKey(row.surah_number, row.ayah_number), {
      ...row,
      surah_name: forcedSurahName || row.surah_name || `Surah ${row.surah_number}`,
    });
  }

  for (const row of remoteRows) {
    if (!row || !Number.isInteger(row.surah_number) || !Number.isInteger(row.ayah_number)) continue;
    const key = makeAyahKey(row.surah_number, row.ayah_number);
    const prev = merged.get(key);
    const forcedSurahName = remoteSurahNames.get(row.surah_number);
    if (!prev) {
      merged.set(key, {
        ...row,
        surah_name: forcedSurahName || row.surah_name || `Surah ${row.surah_number}`,
      });
      continue;
    }

    // Keep existing fields and prefer remote for non-empty content.
    merged.set(key, {
      ...prev,
      ...row,
      arabic_text: pickRicherText(prev.arabic_text, row.arabic_text),
      translation: pickRicherText(prev.translation, row.translation),
      tafseer: pickRicherText(prev.tafseer, row.tafseer),
      surah_name: forcedSurahName || row.surah_name || prev.surah_name || `Surah ${row.surah_number}`,
      source_post_id: row.source_post_id ?? prev.source_post_id ?? null,
    });
  }

  return Array.from(merged.values()).map((row) => {
    const forcedSurahName = remoteSurahNames.get(row.surah_number);
    return {
      ...row,
      surah_name: forcedSurahName || row.surah_name || `Surah ${row.surah_number}`,
    };
  });
}

export function AppStateProvider({ children }) {
  const [bookmarks, setBookmarks] = useState({});
  const [lastRead, setLastReadState] = useState(null);
  const [profileName, setProfileNameState] = useState('');
  const [profileGender, setProfileGenderState] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [themeMode, setThemeModeState] = useState('dark');
  const [remoteAyahRows, setRemoteAyahRows] = useState([]);
  const [remoteSurahRows, setRemoteSurahRows] = useState([]);
  const [isAyahSyncing, setIsAyahSyncing] = useState(false);
  const [ayahDataSource, setAyahDataSource] = useState('local');
  const [ayahSyncError, setAyahSyncError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  const remoteSurahNameMap = useMemo(() => {
    const out = new Map();
    for (const row of remoteSurahRows || []) {
      if (!row || !Number.isInteger(row.surah_number)) continue;
      const name = String(row.surah_name || '').trim();
      if (name) out.set(row.surah_number, name);
    }
    return out;
  }, [remoteSurahRows]);

  const effectiveAyahRows = useMemo(
    () => mergeAyahRows(ayahRows, remoteAyahRows),
    [remoteAyahRows]
  );
  const { surahs: indexedSurahs, ayahsBySurah, ayahByKey } = useMemo(() => buildQuranIndex(effectiveAyahRows), [effectiveAyahRows]);
  const surahs = useMemo(() => {
    const merged = new Map(indexedSurahs.map((surah) => [surah.surah_number, { ...surah }]));

    for (const row of remoteSurahRows || []) {
      if (!row || !Number.isInteger(row.surah_number)) continue;
      const existing = merged.get(row.surah_number);
      const remoteName = String(row.surah_name || '').trim();
      if (existing) {
        merged.set(row.surah_number, {
          ...existing,
          surah_name: remoteName || existing.surah_name,
          ayah_count: existing.ayah_count || 0,
        });
      } else if (remoteName) {
        merged.set(row.surah_number, {
          surah_number: row.surah_number,
          surah_name: remoteName,
          ayah_count: 0,
        });
      }
    }

    return Array.from(merged.values()).sort((a, b) => a.surah_number - b.surah_number).map((surah) => ({
      ...surah,
      surah_name: remoteSurahNameMap.get(surah.surah_number) || surah.surah_name,
    }));
  }, [indexedSurahs, remoteSurahNameMap]);
  const mergedAyahsBySurah = useMemo(() => {
    const out = { ...(ayahsBySurah || {}) };
    for (const surah of surahs) {
      if (!out[surah.surah_number]) out[surah.surah_number] = [];
    }
    return out;
  }, [ayahsBySurah, surahs]);
  const surahNameByNumber = useMemo(() => {
    const out = {};
    for (const surah of surahs) {
      out[surah.surah_number] = surah.surah_name;
    }
    return out;
  }, [surahs]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const [bookmarkRaw, lastReadRaw, profileRaw, profileGenderRaw, deviceRaw, themeRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_BOOKMARKS),
          AsyncStorage.getItem(STORAGE_LAST_READ),
          AsyncStorage.getItem(STORAGE_PROFILE_NAME),
          AsyncStorage.getItem(STORAGE_PROFILE_GENDER),
          AsyncStorage.getItem(STORAGE_DEVICE_ID),
          AsyncStorage.getItem(STORAGE_THEME_MODE),
        ]);

        if (!mounted) return;

        if (bookmarkRaw) {
          const parsed = JSON.parse(bookmarkRaw);
          if (parsed && typeof parsed === 'object') setBookmarks(parsed);
        }

        if (lastReadRaw) {
          const parsed = JSON.parse(lastReadRaw);
          if (parsed && typeof parsed === 'object') setLastReadState(parsed);
        }

        if (typeof profileRaw === 'string') setProfileNameState(profileRaw);
        if (profileGenderRaw === 'male' || profileGenderRaw === 'female') setProfileGenderState(profileGenderRaw);

        if (deviceRaw && typeof deviceRaw === 'string') {
          setDeviceId(deviceRaw);
        } else {
          const generated = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          setDeviceId(generated);
          await AsyncStorage.setItem(STORAGE_DEVICE_ID, generated);
        }

        if (themeRaw === 'light' || themeRaw === 'dark') {
          setThemeModeState(themeRaw);
        }
      } catch (_error) {
      } finally {
        if (mounted) setIsHydrated(true);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_BOOKMARKS, JSON.stringify(bookmarks)).catch(() => {});
  }, [bookmarks, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_LAST_READ, JSON.stringify(lastRead)).catch(() => {});
  }, [lastRead, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_PROFILE_NAME, profileName || '').catch(() => {});
  }, [profileName, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_PROFILE_GENDER, profileGender || '').catch(() => {});
  }, [profileGender, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_THEME_MODE, themeMode).catch(() => {});
  }, [themeMode, isHydrated]);

  const refreshAyahData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAyahDataSource('local');
      setAyahSyncError('Supabase is not configured in app runtime.');
      return;
    }

    setIsAyahSyncing(true);
    const [ayahResult, surahResult] = await Promise.all([
      supabase
        .from('ayahs')
        .select('surah_number,surah_name,juz_number,ayah_number,arabic_text,translation,tafseer,source_post_id')
        .order('surah_number', { ascending: true })
        .order('ayah_number', { ascending: true }),
      supabase
        .from('surahs')
        .select('surah_number,surah_name')
        .order('surah_number', { ascending: true }),
    ]);

    const ayahData = Array.isArray(ayahResult.data) ? ayahResult.data : [];
    const surahData = Array.isArray(surahResult.data) ? surahResult.data : [];

    if (!ayahResult.error) setRemoteAyahRows(ayahData);
    if (!surahResult.error) setRemoteSurahRows(surahData);

    const hasRemoteAyahs = !ayahResult.error && ayahData.length > 0;
    const hasRemoteSurahs = !surahResult.error && surahData.length > 0;

    if (hasRemoteAyahs || hasRemoteSurahs) {
      setAyahDataSource('supabase');
      setAyahSyncError('');
    } else {
      setAyahDataSource('local');
      if (surahResult.error?.message) {
        setAyahSyncError(`surahs: ${surahResult.error.message}`);
      } else if (ayahResult.error?.message) {
        setAyahSyncError(`ayahs: ${ayahResult.error.message}`);
      } else {
        setAyahSyncError('Supabase returned no ayahs or surahs rows.');
      }
    }
    setIsAyahSyncing(false);
  }, []);

  useEffect(() => {
    refreshAyahData();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let active = true;
    const scheduleRefresh = () => {
      if (!active) return;
      refreshAyahData().catch(() => {});
    };

    const ayahsChannel = supabase
      .channel('ruju-ayahs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ayahs' }, scheduleRefresh)
      .subscribe();

    const surahsChannel = supabase
      .channel('ruju-surahs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surahs' }, scheduleRefresh)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ayahsChannel).catch(() => {});
      supabase.removeChannel(surahsChannel).catch(() => {});
    };
  }, [refreshAyahData]);

  const bookmarkedAyahs = useMemo(() => {
    const out = [];
    const keys = Object.keys(bookmarks).filter((key) => bookmarks[key]);
    for (const key of keys) {
      if (ayahByKey[key]) out.push(ayahByKey[key]);
    }
    out.sort((a, b) => a.surah_number - b.surah_number || a.ayah_number - b.ayah_number);
    return out;
  }, [ayahByKey, bookmarks]);

  const value = {
    surahs,
    ayahsBySurah,
    ayahsBySurah: mergedAyahsBySurah,
    ayahByKey,
    bookmarks,
    bookmarkedAyahs,
    lastRead,
    profileName,
    profileGender,
    themeMode,
    ayahDataSource,
    ayahSyncError,
    isAyahSyncing,
    deviceId,
    isHydrated,
    hasProfileName: !!profileName.trim() && (profileGender === 'male' || profileGender === 'female'),
    setProfileName: (name) => setProfileNameState((name || '').trim()),
    setProfileGender: (gender) => setProfileGenderState(gender === 'female' ? 'female' : 'male'),
    setProfileSetup: (name, gender) => {
      setProfileNameState((name || '').trim());
      setProfileGenderState(gender === 'female' ? 'female' : 'male');
    },
    setThemeMode: (mode) => setThemeModeState(mode === 'light' ? 'light' : 'dark'),
    toggleThemeMode: () => setThemeModeState((prev) => (prev === 'light' ? 'dark' : 'light')),
    isBookmarked: (surahNumber, ayahNumber) => {
      return !!bookmarks[makeAyahKey(surahNumber, ayahNumber)];
    },
    toggleBookmark: (ayah) => {
      const key = makeAyahKey(ayah.surah_number, ayah.ayah_number);
      setBookmarks((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    setLastRead: (ayah) => {
      setLastReadState({
        surah_number: ayah.surah_number,
        surah_name: surahNameByNumber[ayah.surah_number] || ayah.surah_name,
        ayah_number: ayah.ayah_number,
        at: new Date().toISOString(),
      });
    },
    clearBookmarks: () => setBookmarks({}),
    clearLastRead: () => setLastReadState(null),
    clearProfileSetup: () => {
      setProfileNameState('');
      setProfileGenderState('');
    },
    refreshAyahData,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
