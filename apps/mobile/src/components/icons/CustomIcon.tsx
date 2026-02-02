import { View } from 'react-native';

/**
 * Use this when you want to render a custom SVG from assets/icons.
 * 1. Add your .svg file under assets/icons/
 * 2. Import it (with react-native-svg-transformer) and pass as children.
 *
 * Example (after adding SVG transformer):
 *   import LogoIcon from '../../../assets/icons/my-logo.svg';
 *   <CustomIcon><LogoIcon width={24} height={24} /></CustomIcon>
 *
 * Or pass any React node (e.g. another Icon, or an imported SVG component).
 */
interface CustomIconProps {
  children: React.ReactNode;
}

export function CustomIcon({ children }: CustomIconProps) {
  return <View>{children}</View>;
}
