import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radii, spacing } from '../constants/colors';
import type { DropResult } from '../lib/flux-types';

export interface PostWorkoutNudgeProps {
  dropResult: DropResult;
  onDone: () => void;
  reduceMotion?: boolean;
}

function formatDrops(n: number): string {
  return n.toLocaleString('en-US');
}

export default function PostWorkoutNudge({ dropResult, onDone, reduceMotion }: PostWorkoutNudgeProps) {
  const { dropsEarned, newTotal, tierAdvanced, newTier } = dropResult;

  const celebrationScale = useSharedValue(reduceMotion ? 1 : 0.85);
  const celebrationOpacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!tierAdvanced) return;
    if (reduceMotion) {
      celebrationScale.value = 1;
      celebrationOpacity.value = 1;
    } else {
      celebrationScale.value = withTiming(1, { duration: 400 });
      celebrationOpacity.value = withTiming(1, { duration: 400 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierAdvanced, reduceMotion]);

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: celebrationOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>
        ⚡ +{formatDrops(dropsEarned)} drops · {formatDrops(newTotal)} total
      </Text>

      {tierAdvanced && newTier ? (
        <Animated.View style={[styles.celebration, celebrationStyle]}>
          <Text style={styles.celebrationText}>Your bucket grew: {newTier.name}</Text>
        </Animated.View>
      ) : null}

      <View style={styles.focusCard}>
        <Text style={styles.focusLabel}>FOCUS WINDOW OPEN</Text>
        <Text style={styles.focusBody}>
          Post-workout is prime focus time for a lot of ADHD brains. Want to point
          it at something?
        </Text>
      </View>

      <Pressable onPress={onDone} style={styles.doneButton} hitSlop={8}>
        <Text style={styles.doneButtonText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.cardGap,
  },
  headline: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.03 * 20,
    color: colors.textPrimary,
  },
  celebration: {
    backgroundColor: colors.purpleSoft,
    borderRadius: radii.medium,
    padding: spacing.cardPadding,
  },
  celebrationText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.purple,
  },
  focusCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.medium,
    padding: spacing.cardPadding,
    gap: 6,
  },
  focusLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.08 * 12,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  focusBody: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 15 * 1.5,
    color: colors.textPrimary,
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
