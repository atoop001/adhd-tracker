import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../../constants/colors';
import { useSettings } from '../../context/SettingsContext';
import { useDatabaseContext } from '../../context/DatabaseContext';
import { logCheckIn } from '../../lib/flux-workout-service';
import EnergyOrb, { type EnergyLevel } from '../../components/EnergyOrb';

const LEVELS: EnergyLevel[] = [1, 2, 3, 4, 5];

function todayLocal(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function OnboardingEnergyScreen() {
  const router = useRouter();
  const db = useDatabaseContext();
  const { settings } = useSettings();
  const reduceMotion = settings.reduce_animations === 'true';

  const [selected, setSelected] = useState<EnergyLevel | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (level: EnergyLevel) => {
    setSelected(level);
    setSaving(true);
    try {
      await logCheckIn(db, { date: todayLocal(), energyLevel: level, mood: level });
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (selected === null) return;
    router.push(`/(onboarding)/suggestion?energy=${selected}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>How's your energy right now?</Text>
        <Text style={styles.body}>
          There's no right answer. This just helps us meet you where you
          are today.
        </Text>
        <View style={styles.orbRow}>
          {LEVELS.map((level) => (
            <EnergyOrb
              key={level}
              level={level}
              selected={selected === level}
              dimmed={selected !== null}
              onPress={() => handleSelect(level)}
              reduceMotion={reduceMotion}
            />
          ))}
        </View>
      </View>
      <Pressable
        style={[styles.cta, selected === null && styles.ctaDisabled]}
        onPress={handleContinue}
        disabled={selected === null || saving}
        hitSlop={8}
      >
        <Text style={styles.ctaLabel}>Continue</Text>
      </Pressable>
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
  orbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.cardGap,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaDisabled: {
    backgroundColor: colors.surfaceHigh,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
