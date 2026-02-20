import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppStateProvider, useAppState } from './src/state/AppState';
import { getThemeColors } from './src/theme';
import { SurahListScreen } from './src/screens/SurahListScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { BookmarksScreen } from './src/screens/BookmarksScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { MyProfileScreen } from './src/screens/MyProfileScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { NameSetupScreen } from './src/screens/NameSetupScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function tabIcon(name, label, focused, colors) {
  return (
    <>
      <Ionicons name={name} size={18} color={focused ? colors.gold : colors.muted} />
      <Text style={{ color: focused ? colors.gold : colors.muted, fontSize: 10, fontWeight: '700', marginTop: 2 }}>
        {label}
      </Text>
    </>
  );
}

function HomeStackScreen() {
  const { themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Surahs" component={SurahListScreen} options={{ title: 'Ruju Quran' }} />
      <Stack.Screen
        name="Reader"
        component={ReaderScreen}
        options={({ route }) => ({ title: route.params?.surahName || 'Reader' })}
      />
    </Stack.Navigator>
  );
}

function SettingsStackScreen() {
  const { themeMode } = useAppState();
  const colors = getThemeColors(themeMode);
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ title: 'My Profile' }} />
    </Stack.Navigator>
  );
}

function AppShell() {
  const { isHydrated, hasProfileName, setProfileSetup, themeMode } = useAppState();
  const [showSplash, setShowSplash] = useState(true);
  const colors = getThemeColors(themeMode);

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.gold,
    },
  };

  useEffect(() => {
    const id = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(id);
  }, []);

  if (showSplash || !isHydrated) return <SplashScreen />;
  if (!hasProfileName) return <NameSetupScreen onSubmit={setProfileSetup} />;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackScreen}
          options={{ tabBarIcon: ({ focused }) => tabIcon('home-outline', 'HOME', focused, colors), tabBarLabel: () => null }}
        />
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{ tabBarIcon: ({ focused }) => tabIcon('newspaper-outline', 'FEED', focused, colors), tabBarLabel: () => null }}
        />
        <Tab.Screen
          name="Bookmarks"
          component={BookmarksScreen}
          options={{ tabBarIcon: ({ focused }) => tabIcon('bookmark-outline', 'SAVE', focused, colors), tabBarLabel: () => null }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStackScreen}
          options={{ tabBarIcon: ({ focused }) => tabIcon('settings-outline', 'SET', focused, colors), tabBarLabel: () => null }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <AppShell />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
