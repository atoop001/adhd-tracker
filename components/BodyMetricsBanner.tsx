import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../constants/colors';

export default function BodyMetricsBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Body data is just data. No goals, no judgement.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
