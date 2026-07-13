import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii } from '../constants/colors';

export interface TagChipProps {
  label: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  selected: boolean;
  onPress: () => void;
  small?: boolean;
}

export default function TagChip({ label, sentiment, selected, onPress, small }: TagChipProps) {
  const selectedStyle = selected ? selectedStyles[sentiment] : unselectedStyle;
  const textColor = selected ? selectedTextColors[sentiment] : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[styles.chip, small && styles.chipSmall, selectedStyle]}
    >
      <Text style={[styles.label, small && styles.labelSmall, { color: textColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const selectedTextColors = {
  positive: colors.green,
  negative: colors.amber,
  neutral: colors.accent,
} as const;

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.chip,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: 12,
  },
});

const unselectedStyle = {
  backgroundColor: colors.surfaceHigh,
  borderColor: colors.border,
};

const selectedStyles = {
  positive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  negative: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
  },
  neutral: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
} as const;
