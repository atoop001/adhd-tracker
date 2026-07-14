import { useEffect, useRef, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing } from '../../constants/colors';
import SuggestionCard from '../../components/SuggestionCard';
import type { EnergyLevel } from '../../components/EnergyOrb';

function parseEnergyLevel(raw: string | string[] | undefined): EnergyLevel {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = value ? parseInt(value, 10) : NaN;
  if (parsed >= 1 && parsed <= 5) return parsed as EnergyLevel;
  return 3;
}

export default function OnboardingSuggestionScreen() {
  const router = useRouter();
  const { energy } = useLocalSearchParams<{ energy?: string }>();
  const energyLevel = parseEnergyLevel(energy);

  const [showRestMessage, setShowRestMessage] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleStart = () => {
    router.push('/(onboarding)/notifications');
  };

  const handleSkip = () => {
    setShowRestMessage(true);
    timerRef.current = setTimeout(() => {
      router.push('/(onboarding)/notifications');
    }, 900);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Here's a suggestion</Text>
        <Text style={styles.body}>
          Based on where your energy's at — no pressure to match it exactly.
        </Text>
        <SuggestionCard energyLevel={energyLevel} onStart={handleStart} onSkip={handleSkip} />
        {showRestMessage && <Text style={styles.restMessage}>Rest is training too.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.screen,
    justifyContent: 'center',
  },
  content: {
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
  restMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
