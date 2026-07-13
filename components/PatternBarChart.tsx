import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

export interface PatternBarChartDatum {
  day: string;
  avgEnergy: number;
  samples: number;
}

export interface PatternBarChartProps {
  data: PatternBarChartDatum[];
}

const MAX_BAR_HEIGHT = 100;
const MAX_ENERGY = 5;
const HIGH_ENERGY_THRESHOLD = 3.5;

export default function PatternBarChart({ data }: PatternBarChartProps) {
  return (
    <View style={styles.chart}>
      {data.map((datum, index) => {
        const hasSamples = datum.samples > 0;
        const clampedEnergy = Math.max(0, Math.min(MAX_ENERGY, datum.avgEnergy));
        const barHeight = hasSamples
          ? Math.max(4, (clampedEnergy / MAX_ENERGY) * MAX_BAR_HEIGHT)
          : 2;
        const isHigh = hasSamples && clampedEnergy >= HIGH_ENERGY_THRESHOLD;

        return (
          <View key={`${datum.day}-${index}`} style={styles.column}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isHigh ? colors.accent : colors.surfaceHigh,
                  },
                ]}
              />
            </View>
            <Text style={styles.dayLabel}>{datum.day}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    height: MAX_BAR_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 6,
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 11,
    color: colors.textMuted,
  },
});
