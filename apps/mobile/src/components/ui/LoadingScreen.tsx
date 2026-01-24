import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';

const logo = require('../../../assets/logo.png');

interface LoadingScreenProps {
  showLogo?: boolean;
}

export function LoadingScreen({ showLogo = true }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      {showLogo && (
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      )}
      <ActivityIndicator size="large" color="#FF0000" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
