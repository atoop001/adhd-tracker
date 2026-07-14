import { Pressable, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSettings } from '../../context/SettingsContext';
import { colors } from '../../constants/colors';

function ProfileButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      hitSlop={12}
      style={{ marginRight: 16 }}
      accessibilityLabel="Settings"
      accessibilityRole="button"
    >
      <Text style={{ fontSize: 20 }}>{'👤'}</Text>
    </Pressable>
  );
}

function TabIcon({ glyph }: { glyph: string }) {
  return <Text style={{ fontSize: 20 }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { settings } = useSettings();
  const bodyMetricsEnabled = settings.body_metrics_enabled === 'true';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
        headerTintColor: colors.textPrimary,
        headerRight: () => <ProfileButton />,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: () => <TabIcon glyph="⌂" />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarLabel: 'Log',
          tabBarIcon: () => <TabIcon glyph="✍" />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarLabel: 'Insights',
          tabBarIcon: () => <TabIcon glyph="◈" />,
        }}
      />
      <Tabs.Screen
        name="body"
        options={
          bodyMetricsEnabled
            ? {
                title: 'Body',
                tabBarLabel: 'Body',
                tabBarIcon: () => <TabIcon glyph="◎" />,
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="settings"
        options={
          bodyMetricsEnabled
            ? { href: null }
            : {
                title: 'Settings',
                tabBarLabel: 'Settings',
                tabBarIcon: () => <TabIcon glyph="⚙" />,
              }
        }
      />
    </Tabs>
  );
}
