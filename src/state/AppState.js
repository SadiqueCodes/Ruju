import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ayahRows from '../../ayahs_formatted.json';
import { buildQuranIndex } from '../utils/quranData';

const STORAGE_BOOKMARKS = 'ruju.bookmarks.v1';
const STORAGE_LAST_READ = 'ruju.lastRead.v1';
const STORAGE_PROFILE_NAME = 'ruju.profileName.v1';
const STORAGE_DEVICE_ID = 'ruju.deviceId.v1';

const AppStateContext = createContext(null);

function makeAyahKey(surahNumber, ayahNumber) {
  return `${surahNumber}:${ayahNumber}`;
}

export function AppStateProvider({ children }) {
  const [bookmarks, setBookmarks] = useState({});
  const [lastRead, setLastReadState] = useState(null);
  const [profileName, setProfileNameState] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  const { surahs, ayahsBySurah, ayahByKey } = useMemo(() => buildQuranIndex(ayahRows), []);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const [bookmarkRaw, lastReadRaw, profileRaw, deviceRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_BOOKMARKS),
          AsyncStorage.getItem(STORAGE_LAST_READ),
          AsyncStorage.getItem(STORAGE_PROFILE_NAME),
          AsyncStorage.getItem(STORAGE_DEVICE_ID),
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

        if (deviceRaw && typeof deviceRaw === 'string') {
          setDeviceId(deviceRaw);
        } else {
          const generated = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          setDeviceId(generated);
          await AsyncStorage.setItem(STORAGE_DEVICE_ID, generated);
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
    deviceId,
    isHydrated,
    hasProfileName: !!profileName.trim(),
    setProfileName: (name) => setProfileNameState((name || '').trim()),
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
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}
