import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { getStoredToken, fetchMe } from './src/api/auth';

type Screen = 'loading' | 'login' | 'home';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [username, setUsername] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getStoredToken();
      if (!token) {
        if (!cancelled) setScreen('login');
        return;
      }
      const user = await fetchMe(token);
      if (!cancelled) {
        if (user) {
          setUsername(user.username);
          setScreen('home');
        } else {
          setScreen('login');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLoginSuccess = (u: string) => {
    setUsername(u);
    setScreen('home');
  };

  const handleLogout = () => {
    setUsername('');
    setScreen('login');
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      {screen === 'loading' && <LoadingScreen />}
      {screen === 'login' && <LoginScreen onLoginSuccess={handleLoginSuccess} />}
      {screen === 'home' && <HomeScreen username={username} onLogout={handleLogout} />}
    </View>
  );
}
