// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/

import Ionicons from '@expo/vector-icons/Ionicons';
import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps, type ReactNode } from 'react';

export function TabBarIcon(props: IconProps<ComponentProps<typeof Ionicons>['name']>): ReactNode {
  const { style, ...rest } = props; // destructure needed to get remaining content into "rest"
  return <Ionicons size={28} style={[{ marginBottom: -3 }, props.style]} {...rest} />;
}
