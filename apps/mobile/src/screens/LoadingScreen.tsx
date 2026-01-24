import { StyleSheet, View, Image, ActivityIndicator } from 'react-native';

const logo = require('../../assets/logo.png');

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color="#FF0000" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 240,
    height: 54,
    marginBottom: 48,
  },
  spinner: {
    marginTop: 8,
  },
});
