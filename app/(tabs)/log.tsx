import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export default function LogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Log</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.08,
    textTransform: 'uppercase',
  },
});
