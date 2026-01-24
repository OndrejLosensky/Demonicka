import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { clearStoredToken } from '../api/auth';

const logo = require('../../assets/logo.png');

interface HomeScreenProps {
  username: string;
  onLogout: () => void;
}

export function HomeScreen({ username, onLogout }: HomeScreenProps) {
  const handleLogout = async () => {
    await clearStoredToken();
    onLogout();
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.greeting}>Ahoj, {username}!</Text>
      <Text style={styles.sub}>Jste přihlášen.</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Odhlásit se</Text>
      </TouchableOpacity>
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
    width: 220,
    height: 50,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  sub: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
