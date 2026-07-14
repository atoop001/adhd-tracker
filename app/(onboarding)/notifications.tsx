import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../../constants/colors';
import { useSettings } from '../../context/SettingsContext';
import { useDatabaseContext } from '../../context/DatabaseContext';
import { scheduleCheckInReminder } from '../../lib/flux-notifications';

const TIME_PRESETS: { label: string; time: string }[] = [
  { label: 'Morning 08:00', time: '08:00' },
  { label: 'Midday 12:00', time: '12:00' },
  { label: 'Evening 18:00', time: '18:00' },
];

export default function OnboardingNotificationsScreen() {
  const router = useRouter();
  const db = useDatabaseContext();
  const { setSetting } = useSettings();

  const [selectedTime, setSelectedTime] = useState(TIME_PRESETS[0].time);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    await setSetting('onboarding_complete', 'true');
    router.replace('/(tabs)');
  };

  const handleRemindMe = async () => {
    setBusy(true);
    try {
      await setSetting('notification_time', selectedTime);
      await setSetting('notification_enabled', 'true');
      await scheduleCheckInReminder(db, selectedTime);
      await finish();
    } finally {
      setBusy(false);
    }
  };

  const handleNoThanks = async () => {
    setBusy(true);
    try {
      await finish();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Want a daily nudge?</Text>
        <Text style={styles.body}>
          A single reminder to check in with yourself — nothing more.
          Change or turn it off anytime in Settings.
        </Text>
        <View style={styles.presetRow}>
          {TIME_PRESETS.map((preset) => {
            const active = preset.time === selectedTime;
            return (
              <Pressable
                key={preset.time}
                onPress={() => setSelectedTime(preset.time)}
                style={[styles.preset, active && styles.presetActive]}
                hitSlop={8}
              >
                <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.cta} onPress={handleRemindMe} disabled={busy} hitSlop={8}>
          <Text style={styles.ctaLabel}>Remind me</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={handleNoThanks} disabled={busy} hitSlop={8}>
          <Text style={styles.secondaryLabel}>No thanks</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.screen,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.cardGap,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.03 * 26,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  presetRow: {
    gap: 12,
    marginTop: spacing.cardGap,
  },
  preset: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    paddingVertical: 14,
    alignItems: 'center',
  },
  presetActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  presetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetLabelActive: {
    color: colors.textPrimary,
  },
  actions: {
    gap: 12,
    marginBottom: 8,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderRadius: radii.medium,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
