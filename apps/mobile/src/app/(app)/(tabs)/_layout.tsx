import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/icons';
import { canAccess } from '../../../utils/permissions';
import { useAuthStore } from '../../../store/auth.store';
import { useRole } from '../../../hooks/useRole';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { useTheme } from '../../../hooks/useTheme';
import { useThemeColors } from '../../../hooks/useThemeColors';

const TAB_BAR_HEIGHT = 75;

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();
  const { isOperator } = useRole();
  const { activeEvent } = useActiveEvent();
  const { isDark } = useTheme();
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF0000',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            backgroundColor: colors.tabBarBg,
            borderTopColor: colors.tabBarBorder,
          },
        ],
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
          title: 'Přehled události',
          tabBarIcon: ({ color }) => <Icon name="calendar" size={20} color={color} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Události',
          tabBarIcon: ({ color }) => <Icon name="chart" size={20} color={color} />,
          href: isOperator ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Galerie',
          tabBarIcon: ({ color }) => <Icon name="image" size={20} color={color} />,
          href: isOperator ? null : undefined,
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
        name="beer-pong"
        options={{
          title: 'Beer Pong',
          tabBarIcon: ({ color }) => <Icon name="beer-pong" size={20} color={color} />,
          href: canAccess('beerPong', user) && activeEvent?.beerPongEnabled ? undefined : null,
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
    borderTopWidth: 1,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
