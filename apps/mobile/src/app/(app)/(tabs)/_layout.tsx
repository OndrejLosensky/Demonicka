import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { useRole } from '../../../hooks/useRole';
import { canAccess } from '../../../utils/permissions';
import { useAuthStore } from '../../../store/auth.store';

export default function TabsLayout() {
  const { isOperator, isAdmin } = useRole();
  const user = useAuthStore((state) => state.user);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF0000',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Přehled',
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="event"
        options={{
          title: 'Událost',
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="beer-pong"
        options={{
          title: 'Beer Pong',
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>🏓</Text>,
        }}
      />
      <Tabs.Screen
        name="participants"
        options={{
          title: 'Účastníci',
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>👥</Text>,
          href: canAccess('participants', user) ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="barrels"
        options={{
          title: 'Sudy',
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>🍺</Text>,
          href: canAccess('barrels', user) ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Nastavení',
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 4,
    height: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  icon: {
    fontSize: 20,
  },
});
