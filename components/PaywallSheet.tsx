// components/PaywallSheet.tsx
//
// Bottom-sheet paywall. Purely presentational — the caller wires onUnlock
// to whatever purchase flow is live (today: lib/flux-purchases stub;
// later: react-native-purchases). Never a full-screen interrupt, never the
// words "Upgrade" or "Premium".

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../constants/colors';

export interface PaywallSheetProps {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export default function PaywallSheet({ visible, onClose, onUnlock }: PaywallSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.headline}>Your patterns are ready. Unlock them.</Text>
          <Text style={styles.body}>
            Flux Full includes complete insights and body metrics tracking.
          </Text>
          <Text style={styles.price}>
            $7.99/month or $54.99/year · 30-day free trial
          </Text>
          <Pressable style={styles.primaryButton} onPress={onUnlock} hitSlop={8}>
            <Text style={styles.primaryButtonLabel}>Start free trial</Text>
          </Pressable>
          <Pressable style={styles.ghostButton} onPress={onClose} hitSlop={8}>
            <Text style={styles.ghostButtonLabel}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.large,
    borderTopRightRadius: radii.large,
    padding: spacing.screen,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.03 * 22,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22.5,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ghostButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
