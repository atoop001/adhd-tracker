import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { DatabaseProvider } from '../context/DatabaseContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { colors } from '../constants/colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // No spinner: render nothing until fonts are ready.
  if (!fontsLoaded) return null;

  return (
    <DatabaseProvider>
      <SettingsProvider>
        <RootLayoutNav />
      </SettingsProvider>
    </DatabaseProvider>
  );
}

function RootLayoutNav() {
  const { settings, loading } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (settings.onboarding_complete !== 'true') {
      router.replace('/(onboarding)');
    } else {
      router.replace('/(tabs)');
    }
  }, [loading, settings.onboarding_complete, router]);

  // No spinner: render nothing until settings are ready.
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </>
  );
}
