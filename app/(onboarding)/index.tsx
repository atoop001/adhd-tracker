import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../../constants/colors';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>
          Fitness apps weren't built for your brain.{'\n'}This one is.
        </Text>
        <Text style={styles.body}>
          No streaks to break. No guilt for resting. Just a bucket that
          fills up, one honest session at a time.
        </Text>
        <Text style={styles.body}>
          Some days you'll show up big. Some days barely at all. Both count
          here.
        </Text>
      </View>
      <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/energy')} hitSlop={8}>
        <Text style={styles.ctaLabel}>Let's go</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.screen,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.cardGap,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.03 * 30,
    lineHeight: 38,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
