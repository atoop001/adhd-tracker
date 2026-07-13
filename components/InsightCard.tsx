import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../constants/colors';

export interface InsightCardProps {
  icon: string;
  title: string;
  body: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export default function InsightCard({ icon, title, body, sentiment }: InsightCardProps) {
  const cardStyle = cardStyles[sentiment];
  const titleColor = titleColors[sentiment];

  return (
    <View style={[styles.card, cardStyle]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const titleColors = {
  positive: colors.green,
  negative: colors.amber,
  neutral: colors.textPrimary,
} as const;

const cardStyles = {
  positive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  negative: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
  },
  neutral: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.border,
  },
} as const;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radii.medium,
    borderWidth: 1,
    padding: spacing.cardPadding,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
});
