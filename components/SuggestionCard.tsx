import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../constants/colors';
import type { EnergyLevel } from './EnergyOrb';

export interface SuggestionCardProps {
  energyLevel: EnergyLevel;
  onStart: () => void;
  onSkip: () => void;
}

const SUGGESTIONS: Record<EnergyLevel, { title: string; body: string; emoji: string }> = {
  1: { title: '2-min breathing stretch', body: 'Gentle. No pressure. Just move a little.', emoji: '🌊' },
  2: { title: '10-min walk', body: 'Low effort, big mood shift. Outside if you can.', emoji: '🚶' },
  3: { title: '20-min bodyweight flow', body: 'A solid middle-ground session.', emoji: '💪' },
  4: { title: '30-min strength circuit', body: "You've got fuel — use it.", emoji: '🔥' },
  5: { title: '45-min high-intensity', body: "Full charge. Let's go hard today.", emoji: '⚡' },
};

export default function SuggestionCard({ energyLevel, onStart, onSkip }: SuggestionCardProps) {
  const { title, body, emoji } = SUGGESTIONS[energyLevel];

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={onStart} hitSlop={8}>
          <Text style={styles.primaryLabel}>Start — just 5 min</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={onSkip} hitSlop={8}>
          <Text style={styles.secondaryLabel}>Not today</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.large,
    padding: spacing.cardPadding,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.03 * 18,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: spacing.cardGap,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  primary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
