import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Rect } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { getTierInfo } from '../lib/bucket_service';
import type { TierInfo } from '../lib/flux-types';

export interface BucketWidgetProps {
  lifetimeDrops: number;
  animateFill?: boolean;
  onTierAdvance?: (tier: TierInfo) => void;
  reduceMotion?: boolean;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const VESSEL_WIDTH = 140;
const VESSEL_HEIGHT = 180;
const VESSEL_RADIUS = 16;
const SHIMMER_WIDTH = 44;
const CLIP_ID = 'bucketWidgetVesselClip';

// Tier names in ascending order, indexed by tier number (1-based). Used to
// resolve the *next* tier's name from the current tier's number — TierInfo
// only carries the current tier's name.
const TIER_NAMES: TierInfo['name'][] = ['Pail', 'Bucket', 'Barrel', 'Trough', 'Reservoir'];

function formatDrops(n: number): string {
  return n.toLocaleString('en-US');
}

export default function BucketWidget({
  lifetimeDrops,
  animateFill,
  onTierAdvance,
  reduceMotion,
}: BucketWidgetProps) {
  const tierInfo = getTierInfo(lifetimeDrops);
  const targetFillHeight = (tierInfo.fillPct / 100) * VESSEL_HEIGHT;

  const fillHeight = useSharedValue(targetFillHeight);
  const shimmerX = useSharedValue(-SHIMMER_WIDTH);

  // Tracks the previous lifetimeDrops so we can detect an actual tier
  // threshold crossing (never fires on mount, never fires when the total
  // is merely re-rendered without changing).
  const prevDropsRef = useRef(lifetimeDrops);

  useEffect(() => {
    if (reduceMotion) {
      fillHeight.value = targetFillHeight;
    } else {
      fillHeight.value = withTiming(targetFillHeight, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetFillHeight, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      // Full bypass: no shimmer motion at all under reduced motion.
      shimmerX.value = -SHIMMER_WIDTH;
      return;
    }
    shimmerX.value = withRepeat(
      withTiming(VESSEL_WIDTH + SHIMMER_WIDTH, { duration: 2200, easing: Easing.linear }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  useEffect(() => {
    if (animateFill) {
      const prevTier = getTierInfo(prevDropsRef.current).tier;
      if (tierInfo.tier > prevTier) {
        onTierAdvance?.(tierInfo);
      }
    }
    prevDropsRef.current = lifetimeDrops;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifetimeDrops, animateFill]);

  const waterAnimatedProps = useAnimatedProps(() => ({
    y: VESSEL_HEIGHT - fillHeight.value,
    height: fillHeight.value,
  }));

  const shimmerAnimatedProps = useAnimatedProps(() => ({
    x: shimmerX.value,
  }));

  const nextTierName = tierInfo.dropsToNext !== null ? TIER_NAMES[tierInfo.tier] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.tierName}>{tierInfo.name}</Text>

      <Svg width={VESSEL_WIDTH} height={VESSEL_HEIGHT}>
        <Defs>
          <ClipPath id={CLIP_ID}>
            <Rect
              x={0}
              y={0}
              width={VESSEL_WIDTH}
              height={VESSEL_HEIGHT}
              rx={VESSEL_RADIUS}
              ry={VESSEL_RADIUS}
            />
          </ClipPath>
        </Defs>

        <Rect
          x={0}
          y={0}
          width={VESSEL_WIDTH}
          height={VESSEL_HEIGHT}
          rx={VESSEL_RADIUS}
          ry={VESSEL_RADIUS}
          fill={colors.surfaceHigh}
          stroke={colors.border}
          strokeWidth={2}
        />

        <AnimatedRect
          x={0}
          width={VESSEL_WIDTH}
          fill={colors.accent}
          clipPath={`url(#${CLIP_ID})`}
          animatedProps={waterAnimatedProps}
        />

        {!reduceMotion && (
          <AnimatedRect
            y={0}
            width={SHIMMER_WIDTH}
            height={VESSEL_HEIGHT}
            fill={colors.textPrimary}
            opacity={0.08}
            clipPath={`url(#${CLIP_ID})`}
            animatedProps={shimmerAnimatedProps}
          />
        )}
      </Svg>

      <Text style={styles.dropsTotal}>{formatDrops(lifetimeDrops)} total drops</Text>

      {nextTierName ? (
        <Text style={styles.subtext}>
          {formatDrops(tierInfo.dropsToNext as number)} drops to {nextTierName}
        </Text>
      ) : (
        <Text style={styles.subtext}>No ceiling. Keep pouring.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  tierName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.03 * 22,
    color: colors.textPrimary,
  },
  dropsTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});
