import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../constants/colors';

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface EnergyOrbProps {
  level: EnergyLevel;
  selected: boolean;
  /** Parent sets this on non-selected orbs whenever any orb is selected.
   *  Dims to 0.45 opacity but the orb STAYS pressable so users can change
   *  their selection. */
  dimmed?: boolean;
  onPress: () => void;
  /** Not pressable. Also renders dimmed, but do not use this for dimming alone. */
  disabled?: boolean;
  reduceMotion?: boolean;
}

// Orb-specific tints: two custom hexes outside the constants/colors.ts token set,
// permitted only for this level->colour map per the component brief.
const ORB_TINTS: Record<EnergyLevel, string> = {
  1: '#5A6478',
  2: '#8B7BD8',
  3: colors.teal,
  4: colors.green,
  5: '#5EE6B0',
};

const ORB_META: Record<EnergyLevel, { emoji: string; label: string }> = {
  1: { emoji: '😴', label: 'Drained' },
  2: { emoji: '🌙', label: 'Low' },
  3: { emoji: '🙂', label: 'Steady' },
  4: { emoji: '⚡', label: 'Good' },
  5: { emoji: '🔥', label: 'Charged' },
};

const ORB_SIZE = 56;
const SELECTED_SCALE = 1.15;
const DIMMED_OPACITY = 0.45;

export default function EnergyOrb({ level, selected, dimmed, onPress, disabled, reduceMotion }: EnergyOrbProps) {
  const tint = ORB_TINTS[level];
  const { emoji, label } = ORB_META[level];

  // Precedence: selected orbs are never dimmed; `dimmed` dims but stays pressable;
  // `disabled` also dims and additionally blocks presses.
  const isDim = !selected && (dimmed || disabled);

  const scale = useSharedValue(selected ? SELECTED_SCALE : 1);
  const opacity = useSharedValue(isDim ? DIMMED_OPACITY : 1);

  useEffect(() => {
    const target = selected ? SELECTED_SCALE : 1;
    scale.value = reduceMotion ? target : withSpring(target, { damping: 12, stiffness: 180 });
  }, [selected, reduceMotion, scale]);

  useEffect(() => {
    const target = isDim ? DIMMED_OPACITY : 1;
    opacity.value = reduceMotion ? target : withSpring(target);
  }, [isDim, reduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} style={styles.container}>
      <Animated.View
        style={[
          styles.orb,
          { backgroundColor: tint, shadowColor: tint },
          selected && styles.orbSelected,
          animatedStyle,
        ]}
      >
        <View style={[styles.highlight, { backgroundColor: colors.textPrimary }]} />
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
      <Text style={[styles.label, selected && { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbSelected: {
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  highlight: {
    position: 'absolute',
    top: 6,
    left: 10,
    width: ORB_SIZE * 0.4,
    height: ORB_SIZE * 0.3,
    borderRadius: ORB_SIZE * 0.2,
    opacity: 0.18,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
