import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleProp, ViewStyle } from 'react-native';

/**
 * Semantic icon names aligned with the web app (MUI icons).
 * Add new names here and map to MaterialCommunityIcons glyph names.
 * Browse: https://icons.expo.fyi/Index/MaterialCommunityIcons
 */
export type IconName =
  | 'beer'
  | 'chart'
  | 'group'
  | 'barrel'
  | 'calendar'
  | 'home'
  | 'beer-pong'
  | 'settings'
  | 'lock'
  | 'clock'
  | 'person'
  | 'inbox'
  | 'info'
  | 'refresh'
  | 'add'
  | 'remove'
  | 'spill';

const ICON_MAP: Record<IconName, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  beer: 'glass-mug',
  chart: 'chart-line',
  group: 'account-group',
  barrel: 'barrel',
  calendar: 'calendar',
  home: 'home',
  'beer-pong': 'table-tennis',
  settings: 'cog',
  lock: 'lock',
  clock: 'clock-outline',
  person: 'account',
  inbox: 'inbox',
  info: 'information-outline',
  refresh: 'refresh',
  add: 'plus',
  remove: 'minus',
  spill: 'cup-water',
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Icon({ name, size = 24, color = '#111', style }: IconProps) {
  const glyph = ICON_MAP[name] ?? 'help-circle';
  return (
    <MaterialCommunityIcons name={glyph} size={size} color={color} style={style} />
  );
}
