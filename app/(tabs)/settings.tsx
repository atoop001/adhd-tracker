import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../../constants/colors';
import { useDatabaseContext } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { cancelCheckInReminder, scheduleCheckInReminder } from '../../lib/flux-notifications';
import {
  getEntitlement,
  purchaseFull,
  setDevEntitlement,
  type EntitlementTier,
} from '../../lib/flux-purchases';
import PaywallSheet from '../../components/PaywallSheet';

const NOTIFICATION_TIME_PRESETS = ['08:00', '12:00', '18:00'];
const WEEKLY_GOAL_PRESETS = ['2', '3', '4', '5'];

const CALORIE_CONSENT_COPY =
  "Calorie tracking is a neutral log. Flux doesn't set targets or evaluate your intake.";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

function PresetRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.presetRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.presetOptions}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={[styles.presetChip, active && styles.presetChipActive]}
              hitSlop={6}
            >
              <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ActionRow({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} hitSlop={8}>
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
    </Pressable>
  );
}

function StaticRow({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, muted && styles.rowLabelMuted]}>{text}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const db = useDatabaseContext();
  const { settings, setSetting } = useSettings();

  const [entitlement, setEntitlement] = useState<EntitlementTier>('full');
  const [paywallVisible, setPaywallVisible] = useState(false);

  const bodyMetricsEnabled = settings.body_metrics_enabled === 'true';

  const refreshEntitlement = useCallback(async () => {
    const tier = await getEntitlement(db);
    setEntitlement(tier);
  }, [db]);

  useEffect(() => {
    refreshEntitlement();
  }, [refreshEntitlement]);

  // Check-ins ---------------------------------------------------------

  const handleNotificationToggle = useCallback(
    async (value: boolean) => {
      await setSetting('notification_enabled', value ? 'true' : 'false');
      if (value) {
        await scheduleCheckInReminder(db, settings.notification_time ?? '08:00');
      } else {
        await cancelCheckInReminder(db);
      }
    },
    [db, setSetting, settings.notification_time]
  );

  const handleNotificationTimeChange = useCallback(
    async (time: string) => {
      await setSetting('notification_time', time);
      if (settings.notification_enabled === 'true') {
        await scheduleCheckInReminder(db, time);
      }
    },
    [db, setSetting, settings.notification_enabled]
  );

  const handleMedicationToggle = useCallback(
    (value: boolean) => {
      setSetting('medication_tracking', value ? 'true' : 'false');
    },
    [setSetting]
  );

  // Body & Nutrition ----------------------------------------------------

  const handleBodyMetricsToggle = useCallback(
    (value: boolean) => {
      if (value) {
        if (entitlement === 'free') {
          setPaywallVisible(true);
          return;
        }
        setSetting('body_metrics_enabled', 'true');
      } else {
        setSetting('body_metrics_enabled', 'false');
      }
    },
    [entitlement, setSetting]
  );

  const handleCalorieToggle = useCallback(
    (value: boolean) => {
      if (!value) {
        setSetting('calorie_tracking', 'false');
        return;
      }

      if (settings.calorie_consent_shown === 'true') {
        setSetting('calorie_tracking', 'true');
        return;
      }

      Alert.alert('Calorie tracking', CALORIE_CONSENT_COPY, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await setSetting('calorie_consent_shown', 'true');
            await setSetting('calorie_tracking', 'true');
          },
        },
      ]);
    },
    [settings.calorie_consent_shown, setSetting]
  );

  const handleUnlock = useCallback(async () => {
    await purchaseFull(db);
    await refreshEntitlement();
    setPaywallVisible(false);
    await setSetting('body_metrics_enabled', 'true');
  }, [db, refreshEntitlement, setSetting]);

  // Progress ------------------------------------------------------------

  const handleWeeklyGoalChange = useCallback(
    (value: string) => {
      setSetting('weekly_goal', value);
    },
    [setSetting]
  );

  const performResetBucket = useCallback(async () => {
    await db.runAsync(
      `UPDATE bucket SET lifetime_drops = 0, current_tier = 1, total_workouts = 0 WHERE id = 1`
    );
  }, [db]);

  const confirmResetBucket = useCallback(() => {
    Alert.alert(
      'Reset bucket',
      'This sets your bucket back to zero. Your workout history stays.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Really reset?', "This can't be undone.", [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: performResetBucket },
            ]);
          },
        },
      ]
    );
  }, [performResetBucket]);

  // Privacy ---------------------------------------------------------------

  const performClearAllData = useCallback(async () => {
    await db.execAsync(`
      DELETE FROM workout_tags;
      DELETE FROM workouts;
      DELETE FROM check_ins;
      DELETE FROM body_logs;
      DELETE FROM calorie_logs;
      DELETE FROM patterns_cache;
      DELETE FROM tags WHERE is_preset = 0;
      UPDATE bucket SET lifetime_drops = 0, current_tier = 1, total_workouts = 0 WHERE id = 1;
    `);
    await setSetting('onboarding_complete', 'false');
    router.replace('/(onboarding)');
  }, [db, setSetting, router]);

  const confirmClearAllData = useCallback(() => {
    Alert.alert(
      'Clear all data',
      'This permanently erases all logged data on this device. Your settings and preset tags stay.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Really clear all data?', "This can't be undone.", [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: performClearAllData },
            ]);
          },
        },
      ]
    );
  }, [performClearAllData]);

  // Display ---------------------------------------------------------------

  const handleReduceAnimationsToggle = useCallback(
    (value: boolean) => {
      setSetting('reduce_animations', value ? 'true' : 'false');
    },
    [setSetting]
  );

  // Developer ---------------------------------------------------------------

  const handleDevEntitlementToggle = useCallback(
    async (value: boolean) => {
      await setDevEntitlement(db, value ? 'full' : 'free');
      await refreshEntitlement();
    },
    [db, refreshEntitlement]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>

      <SettingsSection title="Check-ins">
        <ToggleRow
          label="Daily reminder"
          value={settings.notification_enabled === 'true'}
          onValueChange={handleNotificationToggle}
        />
        <PresetRow
          label="Reminder time"
          options={NOTIFICATION_TIME_PRESETS}
          selected={settings.notification_time ?? '08:00'}
          onSelect={handleNotificationTimeChange}
        />
        <ToggleRow
          label="Medication tracking"
          value={settings.medication_tracking === 'true'}
          onValueChange={handleMedicationToggle}
        />
      </SettingsSection>

      <SettingsSection title="Body & Nutrition">
        <ToggleRow
          label="Body metrics"
          value={bodyMetricsEnabled}
          onValueChange={handleBodyMetricsToggle}
        />
        {bodyMetricsEnabled && (
          <ToggleRow
            label="Calorie tracking"
            value={settings.calorie_tracking === 'true'}
            onValueChange={handleCalorieToggle}
          />
        )}
      </SettingsSection>

      <SettingsSection title="Friends & Challenges">
        <StaticRow text="Friends & challenges — coming soon" muted />
      </SettingsSection>

      <SettingsSection title="Progress">
        <PresetRow
          label="Weekly goal"
          options={WEEKLY_GOAL_PRESETS}
          selected={settings.weekly_goal ?? '3'}
          onSelect={handleWeeklyGoalChange}
        />
        <ActionRow label="Reset bucket" onPress={confirmResetBucket} destructive />
      </SettingsSection>

      <SettingsSection title="Display">
        <ToggleRow
          label="Reduce animations"
          value={settings.reduce_animations === 'true'}
          onValueChange={handleReduceAnimationsToggle}
        />
      </SettingsSection>

      <SettingsSection title="Privacy">
        <StaticRow text="All data stays on this device. No account, no tracking." muted />
        <ActionRow label="Clear all data" onPress={confirmClearAllData} destructive />
      </SettingsSection>

      <SettingsSection title="Account">
        <StaticRow text="Flux is local-first. Accounts arrive with sync + social." muted />
      </SettingsSection>

      <SettingsSection title="DEV">
        <StaticRow text={`Current entitlement: ${entitlement}`} muted />
        <ToggleRow
          label="Full entitlement (dev)"
          value={entitlement === 'full'}
          onValueChange={handleDevEntitlementToggle}
        />
      </SettingsSection>

      <PaywallSheet
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUnlock={handleUnlock}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.screen,
    gap: spacing.cardGap,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.03 * 26,
    color: colors.textPrimary,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.08 * 12,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    paddingHorizontal: spacing.cardPadding,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textPrimary,
    flexShrink: 1,
    paddingRight: 12,
  },
  rowLabelMuted: {
    color: colors.textMuted,
  },
  rowLabelDestructive: {
    color: colors.rose,
    fontWeight: '600',
  },
  presetRow: {
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  presetOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  presetChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: colors.accent,
  },
});
