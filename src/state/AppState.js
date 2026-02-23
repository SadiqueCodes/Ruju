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

  const merged = new Map();
  for (const row of localRows || []) {
    if (!row || !Number.isInteger(row.surah_number) || !Number.isInteger(row.ayah_number)) continue;
    merged.set(makeAyahKey(row.surah_number, row.ayah_number), row);
  }

  for (const row of remoteRows) {
    if (!row || !Number.isInteger(row.surah_number) || !Number.isInteger(row.ayah_number)) continue;
    const key = makeAyahKey(row.surah_number, row.ayah_number);
    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, row);
      continue;
    }

    // Keep existing fields and prefer remote for non-empty content.
    merged.set(key, {
      ...prev,
      ...row,
      arabic_text: pickRicherText(prev.arabic_text, row.arabic_text),
      translation: pickRicherText(prev.translation, row.translation),
      tafseer: pickRicherText(prev.tafseer, row.tafseer),
      surah_name: row.surah_name || prev.surah_name || `Surah ${row.surah_number}`,
      source_post_id: row.source_post_id ?? prev.source_post_id ?? null,
    });
  }

  return Array.from(merged.values());
}

export function AppStateProvider({ children }) {
  const [bookmarks, setBookmarks] = useState({});
  const [lastRead, setLastReadState] = useState(null);
  const [profileName, setProfileNameState] = useState('');
  const [profileGender, setProfileGenderState] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [themeMode, setThemeModeState] = useState('dark');
  const [remoteAyahRows, setRemoteAyahRows] = useState([]);
  const [isAyahSyncing, setIsAyahSyncing] = useState(false);
  const [ayahDataSource, setAyahDataSource] = useState('local');
  const [isHydrated, setIsHydrated] = useState(false);

  const effectiveAyahRows = useMemo(
    () => mergeAyahRows(ayahRows, remoteAyahRows),
    [remoteAyahRows]
  );
  const { surahs, ayahsBySurah, ayahByKey } = useMemo(() => buildQuranIndex(effectiveAyahRows), [effectiveAyahRows]);

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
      return;
    }

    setIsAyahSyncing(true);
    const { data, error } = await supabase
      .from('ayahs')
      .select('surah_number,surah_name,juz_number,ayah_number,arabic_text,translation,tafseer,source_post_id')
      .order('surah_number', { ascending: true })
      .order('ayah_number', { ascending: true });

    if (!error && Array.isArray(data) && data.length) {
      setRemoteAyahRows(data);
      setAyahDataSource('supabase');
    } else {
      setAyahDataSource('local');
    }
    setIsAyahSyncing(false);
  }, []);

  useEffect(() => {
    refreshAyahData();
  }, []);

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
    ayahByKey,
    bookmarks,
    bookmarkedAyahs,
    lastRead,
    profileName,
    profileGender,
    themeMode,
    ayahDataSource,
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
        surah_name: ayah.surah_name,
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
