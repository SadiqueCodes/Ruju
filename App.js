import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppStateProvider, useAppState } from './src/state/AppState';
import { COLORS } from './src/theme';
import { SurahListScreen } from './src/screens/SurahListScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { BookmarksScreen } from './src/screens/BookmarksScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { NameSetupScreen } from './src/screens/NameSetupScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: COLORS.card,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.gold,
  },
};

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.text,
        contentStyle: { backgroundColor: COLORS.bg },
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

function tabIcon(label, focused) {
  return (
    <Text style={{ color: focused ? COLORS.gold : COLORS.muted, fontSize: 11, fontWeight: '700' }}>
      {label}
    </Text>
  );
}

function AppShell() {
  const { isHydrated, hasProfileName, setProfileName } = useAppState();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(id);
  }, []);

  if (showSplash || !isHydrated) return <SplashScreen />;
  if (!hasProfileName) return <NameSetupScreen onSubmit={setProfileName} />;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.card,
            borderTopColor: COLORS.border,
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ tabBarIcon: ({ focused }) => tabIcon('HOME', focused), tabBarLabel: () => null }}
        />
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{ tabBarIcon: ({ focused }) => tabIcon('FEED', focused), tabBarLabel: () => null }}
        />
        <Tab.Screen
          name="Bookmarks"
          component={BookmarksScreen}
          options={{ tabBarIcon: ({ focused }) => tabIcon('SAVE', focused), tabBarLabel: () => null }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarIcon: ({ focused }) => tabIcon('SET', focused), tabBarLabel: () => null }}
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
