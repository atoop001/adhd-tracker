import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../constants/colors';

export interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export default function CollapsibleCard({ title, children, defaultCollapsed }: CollapsibleCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false);

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={() => setCollapsed((prev) => !prev)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.chevron, collapsed && styles.chevronCollapsed]}>▾</Text>
      </Pressable>
      {!collapsed && <View style={styles.content}>{children}</View>}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 16,
    color: colors.textSecondary,
    transform: [{ rotate: '0deg' }],
  },
  chevronCollapsed: {
    transform: [{ rotate: '-90deg' }],
  },
  content: {
    marginTop: 12,
  },
});
