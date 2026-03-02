import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

const logo = require('../../../assets/logo.png');

interface LoadingScreenProps {
  showLogo?: boolean;
}

export function LoadingScreen({ showLogo = true }: LoadingScreenProps) {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {showLogo && (
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      )}
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 50,
    marginBottom: 32,
  },
  spinner: {
    marginTop: 16,
  },
});
