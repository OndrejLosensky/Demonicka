import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Icon } from '../../../components/icons';
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
          tabBarIcon: ({ color }) => <Icon name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="event"
        options={{
          title: 'Událost',
          tabBarIcon: ({ color }) => <Icon name="calendar" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="beer-pong"
        options={{
          title: 'Beer Pong',
          tabBarIcon: ({ color }) => <Icon name="beer-pong" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="participants"
        options={{
          title: 'Účastníci',
          tabBarIcon: ({ color }) => <Icon name="group" size={20} color={color} />,
          href: canAccess('participants', user) ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="barrels"
        options={{
          title: 'Sudy',
          tabBarIcon: ({ color }) => <Icon name="barrel" size={20} color={color} />,
          href: canAccess('barrels', user) ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Nastavení',
          tabBarIcon: ({ color }) => <Icon name="settings" size={20} color={color} />,
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
});
